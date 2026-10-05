import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { getProfileDocumentPrefix } from '@/lib/documentStorage';

const toBase64Data = (value: string) => {
  if (!value || typeof value !== 'string') return null;
  const dataUriMatch = value.match(/^data:([^;]+);base64,(.+)$/i);
  return dataUriMatch ? dataUriMatch[2] : value;
};

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'document';
const DOCUMENT_BUCKET = 'dossier_documents';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

async function ensureDocumentBucket() {
  if (!supabaseAdmin) {
    throw new Error('La clé SUPABASE_SERVICE_ROLE_KEY est requise pour créer le stockage privé des justificatifs.');
  }

  const storage = supabaseAdmin.storage;
  const { error: bucketError } = await storage.getBucket(DOCUMENT_BUCKET);

  if (bucketError && /not found|does not exist|no such bucket/i.test(bucketError.message)) {
    const { error: createError } = await storage.createBucket(DOCUMENT_BUCKET, {
      public: false,
      fileSizeLimit: '10MB',
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    });

    if (createError && !/already exists|duplicate/i.test(createError.message)) {
      throw new Error(`Impossible de créer le stockage ${DOCUMENT_BUCKET} : ${createError.message}`);
    }
  } else if (bucketError) {
    throw new Error(`Impossible de vérifier le stockage Supabase : ${bucketError.message}`);
  }

  return storage.from(DOCUMENT_BUCKET);
}

async function addSignedDocumentUrls(documents: Array<Record<string, any>>) {
  if (!supabaseAdmin) return documents;

  const bucket = supabaseAdmin.storage.from(DOCUMENT_BUCKET);
  return Promise.all(documents.map(async (document) => {
    if (!document.path) return document;

    const { data, error } = await bucket.createSignedUrl(document.path, SIGNED_URL_TTL_SECONDS);
    return {
      ...document,
      url: error ? '' : data.signedUrl,
    };
  }));
}

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ profiles: [], source: 'local' });
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const profiles = await Promise.all((data || []).map(async (profile) => ({
    ...profile,
    name: profile.full_name || '',
    dossierNumero: profile.dossier_numero || '',
    dossierValide: Boolean(profile.dossier_valide),
    status: profile.dossier_status || 'en_attente',
    documents: await addSignedDocumentUrls(Array.isArray(profile.documents) ? profile.documents : []),
    admissionWorkflow: profile.admission_workflow || {},
    candidatureData: profile.candidature_data || null,
    departement: profile.departement || '',
    emploiDuTemps: Array.isArray(profile.emploi_du_temps) ? profile.emploi_du_temps : [],
  })));

  return NextResponse.json({ profiles, source: 'supabase' });
}

export async function POST(req: NextRequest) {
  try {
    let payload: Record<string, any>;
    let incomingFile: File | null = null;
    let incomingCategory = '';

    if (req.headers.get('content-type')?.includes('multipart/form-data')) {
      const formData = await req.formData();
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
      payload = await req.json();
    }

    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Email requis.' }, { status: 400 });
    }

    const db = supabaseAdmin || supabase;

    if (!db) {
      return NextResponse.json(
        { error: 'Supabase non configuré. Les données ont été enregistrées localement.', source: 'local' },
        { status: 200 }
      );
    }

    const rawDocuments = Array.isArray(payload.documents) ? payload.documents.slice(0, 5) : [];
    const existingDocuments = rawDocuments
      .filter((document: any) => !document?.data && document?.path)
      .map((document: any) => ({
        name: typeof document.name === 'string' ? document.name : 'document',
        type: typeof document.type === 'string' ? document.type : 'application/octet-stream',
        category: typeof document.category === 'string' ? document.category : '',
        path: document.path as string,
      }));
    const documentsToUpload = rawDocuments.filter((document: any) => document?.data);
    if (incomingFile) {
      documentsToUpload.push({
        name: incomingFile.name,
        type: incomingFile.type || 'application/octet-stream',
        category: incomingCategory,
        file: incomingFile,
      });
    }
    const storedDocuments: Array<Record<string, string>> = [];

    if (documentsToUpload.length) {
      const bucket = await ensureDocumentBucket();

      for (const doc of documentsToUpload) {
        const name = typeof doc?.name === 'string' && doc.name ? doc.name : 'document';
        const type = typeof doc?.type === 'string' && doc.type ? doc.type : 'application/octet-stream';
        const file = doc.file instanceof File ? doc.file as File : null;
        const base64Data = file ? null : toBase64Data(doc?.data || '');
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

        if (file && file.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: `Le document ${name} dépasse la limite de 10 Mo.` }, { status: 413 });
        }
        if (!allowedTypes.includes(type)) {
          return NextResponse.json({ error: `Le format du document ${name} n’est pas accepté.` }, { status: 415 });
        }
        if (!file && !base64Data) {
          return NextResponse.json(
            { error: `Le document ${name} est vide ou invalide.`, source: 'supabase' },
            { status: 400 }
          );
        }

        const fileBuffer = file
          ? Buffer.from(await file.arrayBuffer())
          : Buffer.from(base64Data as string, 'base64');
        const targetPath = `${getProfileDocumentPrefix(String(payload.email))}${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${slugify(name)}`;
        const { error: uploadError } = await bucket.upload(targetPath, fileBuffer, {
          contentType: type,
          upsert: true,
        });

        if (uploadError) {
          return NextResponse.json({ error: `Échec de l’upload du document ${name}: ${uploadError.message}` }, { status: 400 });
        }

        storedDocuments.push({
          name,
          type,
          category: typeof doc?.category === 'string' ? doc.category : '',
          path: targetPath,
        });
      }
    }

    const profileDocuments = [...existingDocuments, ...storedDocuments];

    const { data: existingProfile, error: profileLookupError } = await db
      .from('profiles')
      .select('id, documents, admission_workflow, candidature_data')
      .eq('email', payload.email)
      .maybeSingle();

    if (profileLookupError) {
      return NextResponse.json({ error: profileLookupError.message }, { status: 400 });
    }

    const profileData = {
      id: existingProfile?.id || randomUUID(),
      email: payload.email,
      full_name: payload.name || '',
      phone: payload.phone || '',
      niveau: payload.niveau || '',
      parcours: payload.parcours || '',
      promotion: payload.promotion || '',
      etablissement: payload.etablissement || '',
      annee: payload.annee || '',
      specialite: payload.specialite || '',
      bio: payload.bio || '',
      diplome: payload.diplome || '',
      photo: payload.photo || '',
      departement: payload.departement || '',
      documents: profileDocuments,
      admission_workflow: payload.admissionWorkflow ?? existingProfile?.admission_workflow ?? {},
      candidature_data: payload.candidatureData ?? existingProfile?.candidature_data ?? null,
      role: payload.role || 'etudiant',
      dossier_status: payload.status || (payload.dossierValide ? 'valide' : 'en_attente'),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await db
      .from('profiles')
      .upsert(profileData, { onConflict: 'email' })
      .select();

    if (error) {
      if (storedDocuments.length && supabaseAdmin) {
        await supabaseAdmin.storage.from(DOCUMENT_BUCKET).remove(storedDocuments.map((document) => document.path));
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const retainedPaths = new Set(profileDocuments.map((document) => document.path));
    const removedPaths = (Array.isArray(existingProfile?.documents) ? existingProfile.documents : [])
      .map((document: { path?: string }) => document?.path)
      .filter((path: unknown): path is string => typeof path === 'string' && !retainedPaths.has(path));
    if (removedPaths.length && supabaseAdmin) {
      const { error: cleanupError } = await supabaseAdmin.storage.from(DOCUMENT_BUCKET).remove(removedPaths);
      if (cleanupError) console.error('Supabase document cleanup error:', cleanupError.message);
    }

    const savedProfile = data?.[0] || profileData;
    return NextResponse.json({
      profile: {
        ...savedProfile,
        documents: await addSignedDocumentUrls(Array.isArray(savedProfile.documents) ? savedProfile.documents : []),
      },
      source: 'supabase',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde du profil.' },
      { status: 500 }
    );
  }
}
