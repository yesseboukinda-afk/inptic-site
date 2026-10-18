import { withSiteAudit } from '@/lib/site-audit';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { deleteStoredFile, saveStoredFile } from '@/lib/localStorage';
import { getProfileDocumentPrefix } from '@/lib/documentStorage';
import { getPostgresPool } from '@/lib/postgres';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { canAccessStaffService } from '@/lib/roles';

const DOCUMENT_BUCKET = 'candidate-documents';
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const PRIVATE_NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
};
const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

type ProfileDocument = {
  name: string;
  type: string;
  category: string;
  path: string;
  url?: string;
};

function canManageCandidateProfiles(role: string, assignedService?: unknown) {
  return canAccessStaffService(role, 'candidate_profiles', assignedService);
}

function documentUrl(email: string, path: string) {
  const params = new URLSearchParams({ email, path });
  return `/api/candidat/profile/document-url?${params.toString()}`;
}

function withDocumentUrls(profile: Record<string, any>) {
  const documents: ProfileDocument[] = Array.isArray(profile.documents) ? profile.documents : [];
  const admissionWorkflow = profile.admission_workflow || {};
  const payment = admissionWorkflow.payment || {};
  const candidatureData = profile.candidature_data || null;
  const filieres = candidatureData && typeof candidatureData === 'object'
    ? [
        ...(Array.isArray(candidatureData.filieresInitiale) ? candidatureData.filieresInitiale : []),
        ...(Array.isArray(candidatureData.filieresContinue) ? candidatureData.filieresContinue : []),
      ].filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    : [];
  return {
    ...profile,
    name: profile.full_name || '',
    dossierNumero: profile.dossier_numero || '',
    dossierValide: Boolean(profile.dossier_valide),
    status: profile.dossier_status || 'en_attente',
    documents: documents.map((document) => ({
      ...document,
      url: document.path ? documentUrl(profile.email, document.path) : '',
    })),
    admissionWorkflow,
    candidatureData,
    filieres,
    filiere: filieres.join(', ') || profile.filiere || '',
    paymentStatus: payment.status === 'success' ? 'paid' : payment.status || undefined,
    paymentOperator: payment.operator || undefined,
    paymentPhone: payment.phone || undefined,
    paymentAmount: payment.amount || undefined,
    paymentTransactionId: payment.transactionId || undefined,
    paymentReference: payment.reference || undefined,
    paymentDate: payment.paidAt || undefined,
    departement: profile.departement || '',
    emploiDuTemps: Array.isArray(profile.emploi_du_temps) ? profile.emploi_du_temps : [],
  };
}

function decodeBase64Document(value: string) {
  const match = value.match(/^data:[^;]+;base64,(.+)$/i);
  const encoded = match ? match[1] : value;
  if (!encoded || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) return null;
  return Buffer.from(encoded, 'base64');
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Session requise. Veuillez vous connecter.' },
      { status: 401, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }

  try {
    const pool = getPostgresPool();
    const result = canManageCandidateProfiles(user.role, user.user_metadata.service ?? user.user_metadata.department)
      ? await pool.query(
          'SELECT * FROM public.profiles ORDER BY updated_at DESC',
        )
      : await pool.query(
          'SELECT * FROM public.profiles WHERE email = $1 ORDER BY updated_at DESC',
          [user.email],
        );
    return NextResponse.json({
      profiles: result.rows.map(withDocumentUrls),
      source: 'postgres',
    }, { headers: PRIVATE_NO_STORE_HEADERS });
  } catch (error) {
    console.error('Erreur PostgreSQL lors du chargement des profils candidats:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json(
      { error: 'Impossible de charger les profils candidats.' },
      { status: 503, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }
}

async function siteAuditedPOST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 });
  }

  const canManageProfiles = canManageCandidateProfiles(user.role, user.user_metadata.service ?? user.user_metadata.department);
  let payload: Record<string, any>;
  let incomingFile: File | null = null;
  let incomingCategory = '';

  try {
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const serializedProfile = formData.get('profile');
      if (typeof serializedProfile !== 'string') {
        return NextResponse.json({ error: 'Profil absent du formulaire de téléversement.' }, { status: 400 });
      }
      payload = JSON.parse(serializedProfile);
      const filePart = formData.get('document');
      incomingFile = filePart instanceof File ? filePart : null;
      incomingCategory = typeof formData.get('documentCategory') === 'string'
        ? String(formData.get('documentCategory'))
        : '';
      if (!incomingFile) {
        return NextResponse.json({ error: 'Fichier manquant dans le formulaire de téléversement.' }, { status: 400 });
      }
    } else {
      payload = await request.json();
    }
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!email) {
    return NextResponse.json({ error: 'Email requis.' }, { status: 400 });
  }
  if (!canManageProfiles && email !== user.email) {
    return NextResponse.json({ error: 'Vous ne pouvez modifier que votre propre profil.' }, { status: 403 });
  }

  const pool = getPostgresPool();
  const savedFiles: string[] = [];
  try {
    const existingResult = await pool.query(
      `SELECT id, documents, admission_workflow, candidature_data, role,
              dossier_status, dossier_valide, dossier_numero
       FROM public.profiles WHERE email = $1 LIMIT 1`,
      [email],
    );
    const existingProfile = existingResult.rows[0];
    const existingWorkflow = existingProfile?.admission_workflow &&
      typeof existingProfile.admission_workflow === 'object'
      ? existingProfile.admission_workflow as Record<string, any>
      : {};
    const preRegistrationResult = canManageProfiles
      ? { rows: [] as Array<{ concours_slug: string | null; created_at: Date }> }
      : await pool.query(
          `SELECT concours_slug, created_at
           FROM public.concours_preinscriptions WHERE user_id = $1 LIMIT 1`,
          [user.id],
        );
    const registeredConcours = preRegistrationResult.rows[0];
    const trustedPreRegistration = registeredConcours
      ? {
          concoursSlug: registeredConcours.concours_slug,
          completedAt: registeredConcours.created_at instanceof Date
            ? registeredConcours.created_at.toISOString()
            : new Date(registeredConcours.created_at).toISOString(),
          status: 'dossier_en_attente',
        }
      : existingWorkflow.preRegistration;
    const requestedWorkflow = payload.admissionWorkflow && typeof payload.admissionWorkflow === 'object'
      ? payload.admissionWorkflow as Record<string, any>
      : {};
    delete requestedWorkflow.documentReview;
    const requestedApplicationAt = requestedWorkflow.applicationCompletedAt;
    const hasExistingApplication = Boolean(existingWorkflow.applicationCompletedAt);
    const hasPreRegistration = Boolean(trustedPreRegistration?.completedAt);
    if (
      !canManageProfiles &&
      typeof requestedApplicationAt === 'string' &&
      !hasExistingApplication &&
      !hasPreRegistration
    ) {
      return NextResponse.json(
        {
          error: 'Effectuez d’abord la préinscription au concours.',
        },
        { status: 409 },
      );
    }

    const oldDocuments: ProfileDocument[] = Array.isArray(existingProfile?.documents)
      ? existingProfile.documents
      : [];
    const oldPaths = new Set(oldDocuments.map((document) => document.path).filter(Boolean));
    const rawDocuments: Array<Record<string, any>> = Array.isArray(payload.documents)
      ? payload.documents.slice(0, 5)
      : [];

    const reusablePaths = rawDocuments
      .filter((document) => !document?.data && typeof document?.path === 'string' && oldPaths.has(document.path))
      .map((document) => document.path as string);
    const knownFiles = reusablePaths.length
      ? await pool.query(
          `SELECT path FROM public.private_files
           WHERE bucket = $1 AND path = ANY($2::text[])`,
          [DOCUMENT_BUCKET, reusablePaths],
        )
      : { rows: [] as Array<{ path: string }> };
    const knownPathSet = new Set(knownFiles.rows.map((row) => row.path));
    const retainedDocuments: ProfileDocument[] = rawDocuments
      .filter((document) => typeof document?.path === 'string' && knownPathSet.has(document.path))
      .map((document) => ({
        name: typeof document.name === 'string' ? document.name : 'document',
        type: typeof document.type === 'string' ? document.type : 'application/octet-stream',
        category: typeof document.category === 'string' ? document.category : '',
        path: document.path,
      }));
    const uploads = rawDocuments.filter((document) => document?.data);
    if (incomingFile) {
      uploads.push({
        name: incomingFile.name,
        type: incomingFile.type || 'application/octet-stream',
        category: incomingCategory,
        file: incomingFile,
      });
    }
    if (retainedDocuments.length + uploads.length > 5) {
      return NextResponse.json({ error: 'Un dossier peut contenir au maximum 5 documents.' }, { status: 400 });
    }

    const preparedUploads: Array<{
      name: string;
      type: string;
      category: string;
      contents: Buffer;
    }> = [];
    for (const document of uploads) {
      const name = typeof document.name === 'string' && document.name ? document.name : 'document';
      const type = typeof document.type === 'string' ? document.type : 'application/octet-stream';
      const file = document.file instanceof File ? document.file : null;
      if (!ALLOWED_DOCUMENT_TYPES.has(type)) {
        return NextResponse.json({ error: `Le format du document ${name} n’est pas accepté.` }, { status: 415 });
      }
      const contents = file
        ? Buffer.from(await file.arrayBuffer())
        : decodeBase64Document(typeof document.data === 'string' ? document.data : '');
      if (!contents?.byteLength) {
        return NextResponse.json({ error: `Le document ${name} est vide ou invalide.` }, { status: 400 });
      }
      if (contents.byteLength > MAX_DOCUMENT_SIZE) {
        return NextResponse.json({ error: `Le document ${name} dépasse la limite de 10 Mo.` }, { status: 413 });
      }

      preparedUploads.push({
        name,
        type,
        category: typeof document.category === 'string' ? document.category : '',
        contents,
      });
    }

    const uploadedDocuments: ProfileDocument[] = [];
    for (const document of preparedUploads) {
      const { name, type, category, contents } = document;
      const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'document';
      const path = `${getProfileDocumentPrefix(email)}${randomUUID()}-${safeName}`;
      await saveStoredFile({
        bucket: DOCUMENT_BUCKET,
        relativePath: path,
        contents,
        originalFilename: name,
        mimeType: type,
        isPublic: false,
        ownerUserId: user.id,
      });
      savedFiles.push(path);
      uploadedDocuments.push({
        name,
        type,
        category,
        path,
      });
    }

    const documents = [...retainedDocuments, ...uploadedDocuments];
    const role = canManageProfiles
      ? (typeof payload.role === 'string' ? payload.role : existingProfile?.role || 'etudiant')
      : existingProfile?.role || 'etudiant';
    const dossierStatus = canManageProfiles && typeof payload.status === 'string'
      ? payload.status
      : existingProfile?.dossier_status || 'en_attente';
    const dossierValide = canManageProfiles && typeof payload.dossierValide === 'boolean'
      ? payload.dossierValide
      : Boolean(existingProfile?.dossier_valide);
    const dossierNumero = canManageProfiles && typeof payload.dossierNumero === 'string'
      ? payload.dossierNumero
      : existingProfile?.dossier_numero ?? null;
    const admissionWorkflow = canManageProfiles
      ? requestedWorkflow
      : {
          ...requestedWorkflow,
          ...(trustedPreRegistration ? { preRegistration: trustedPreRegistration } : { preRegistration: undefined }),
        };

    const result = await pool.query(
      `INSERT INTO public.profiles
         (email, full_name, phone, niveau, parcours, promotion, etablissement, annee,
          specialite, bio, diplome, photo, departement, documents, admission_workflow,
          candidature_data, role, dossier_status, dossier_valide, dossier_numero, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
               $14::jsonb, $15::jsonb, $16::jsonb, $17, $18, $19, $20, NOW())
       ON CONFLICT (email) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         phone = EXCLUDED.phone,
         niveau = EXCLUDED.niveau,
         parcours = EXCLUDED.parcours,
         promotion = EXCLUDED.promotion,
         etablissement = EXCLUDED.etablissement,
         annee = EXCLUDED.annee,
         specialite = EXCLUDED.specialite,
         bio = EXCLUDED.bio,
         diplome = EXCLUDED.diplome,
         photo = EXCLUDED.photo,
         departement = EXCLUDED.departement,
         documents = EXCLUDED.documents,
         admission_workflow = EXCLUDED.admission_workflow,
         candidature_data = EXCLUDED.candidature_data,
         role = EXCLUDED.role,
         dossier_status = EXCLUDED.dossier_status,
         dossier_valide = EXCLUDED.dossier_valide,
         dossier_numero = EXCLUDED.dossier_numero,
         updated_at = NOW()
       RETURNING *`,
      [
        email,
        typeof payload.name === 'string' ? payload.name : '',
        typeof payload.phone === 'string' ? payload.phone : '',
        payload.niveau || '',
        payload.parcours || '',
        payload.promotion || '',
        payload.etablissement || '',
        payload.annee || '',
        payload.specialite || '',
        payload.bio || '',
        payload.diplome || '',
        payload.photo || '',
        payload.departement || '',
        JSON.stringify(documents),
        JSON.stringify(admissionWorkflow),
        JSON.stringify(payload.candidatureData ?? existingProfile?.candidature_data ?? null),
        role,
        dossierStatus,
        dossierValide,
        dossierNumero,
      ],
    );

    const retainedPathSet = new Set(documents.map((document) => document.path));
    const removedPaths = oldDocuments
      .map((document) => document.path)
      .filter((path): path is string => Boolean(path) && !retainedPathSet.has(path));
    for (const path of removedPaths) {
      try {
        await deleteStoredFile(DOCUMENT_BUCKET, path);
      } catch (error) {
        console.error('Échec du nettoyage d’un ancien document candidat:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      }
    }

    return NextResponse.json({
      profile: withDocumentUrls(result.rows[0]),
      source: 'postgres',
    });
  } catch (error) {
    for (const path of savedFiles) {
      try {
        await deleteStoredFile(DOCUMENT_BUCKET, path);
      } catch (cleanupError) {
        console.error('Échec du nettoyage d’un document candidat:', cleanupError instanceof Error ? cleanupError.message : 'UNKNOWN_ERROR');
      }
    }
    console.error('Erreur PostgreSQL lors de la sauvegarde du profil candidat:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de sauvegarder le profil candidat.' }, { status: 503 });
  }
}

export const POST = withSiteAudit("Mise à jour du dossier candidat", siteAuditedPOST);
