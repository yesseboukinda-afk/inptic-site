import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

const toBase64Data = (value: string) => {
  if (!value || typeof value !== 'string') return null;
  const dataUriMatch = value.match(/^data:([^;]+);base64,(.+)$/i);
  return dataUriMatch ? dataUriMatch[2] : value;
};

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'document';

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

  const profiles = (data || []).map((profile) => ({
    ...profile,
    name: profile.full_name || '',
    dossierNumero: profile.dossier_numero || '',
    dossierValide: Boolean(profile.dossier_valide),
    status: profile.dossier_status || 'en_attente',
    documents: Array.isArray(profile.documents) ? profile.documents : [],
    departement: profile.departement || '',
    emploiDuTemps: Array.isArray(profile.emploi_du_temps) ? profile.emploi_du_temps : [],
  }));

  return NextResponse.json({ profiles, source: 'supabase' });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

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
    const existingDocuments = rawDocuments.filter((document: any) => !document?.data && (document?.url || document?.path));
    const documentsToUpload = rawDocuments.filter((document: any) => document?.data);
    const storedDocuments: Array<Record<string, string>> = [];

    if (documentsToUpload.length) {
      const storageBucket = 'dossier_documents';
      const bucket = db.storage.from(storageBucket);
      const bucketCheck = await bucket.list('', { limit: 1 });

      if (bucketCheck.error) {
        return NextResponse.json(
          {
            error: `Le bucket de stockage ${storageBucket} est introuvable. Créez-le dans Supabase Storage pour enregistrer les justificatifs.`,
          },
          { status: 400 }
        );
      }

      for (const doc of documentsToUpload) {
        const name = typeof doc?.name === 'string' && doc.name ? doc.name : 'document';
        const type = typeof doc?.type === 'string' && doc.type ? doc.type : 'application/octet-stream';
        const base64Data = toBase64Data(doc?.data || '');

        if (!base64Data) {
          return NextResponse.json(
            { error: `Le document ${name} est vide ou invalide.`, source: 'supabase' },
            { status: 400 }
          );
        }

        const fileBuffer = Buffer.from(base64Data, 'base64');
        const targetPath = `profiles/${encodeURIComponent(String(payload.email).toLowerCase())}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${slugify(name)}`;
        const { error: uploadError } = await bucket.upload(targetPath, fileBuffer, {
          contentType: type,
          upsert: true,
        });

        if (uploadError) {
          return NextResponse.json({ error: `Échec de l’upload du document ${name}: ${uploadError.message}` }, { status: 400 });
        }

        const { data: publicData } = bucket.getPublicUrl(targetPath);
        storedDocuments.push({
          name,
          type,
          url: publicData?.publicUrl || targetPath,
          path: targetPath,
        });
      }
    }

    const profileData = {
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
      emploi_du_temps: Array.isArray(payload.emploiDuTemps) ? payload.emploiDuTemps.slice(0, 10) : [],
      documents: [...existingDocuments, ...storedDocuments].length ? [...existingDocuments, ...storedDocuments] : (Array.isArray(payload.documents) ? payload.documents.slice(0, 5).map((doc: any) => ({
        name: typeof doc?.name === 'string' ? doc.name : 'document',
        type: typeof doc?.type === 'string' ? doc.type : 'application/octet-stream',
        url: typeof doc?.url === 'string' ? doc.url : '',
        path: typeof doc?.path === 'string' ? doc.path : '',
      })) : []),
      filiere: payload.filiere || '',
      dossier_numero: payload.dossierNumero || '',
      notifications: Array.isArray(payload.notifications) ? payload.notifications.slice(0, 10) : [],
      role: payload.role || 'etudiant',
      dossier_status: payload.status || (payload.dossierValide ? 'valide' : 'en_attente'),
      dossier_valide: Boolean(payload.dossierValide || payload.status === 'valide'),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await db
      .from('profiles')
      .upsert(profileData, { onConflict: 'email' })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ profile: data?.[0] || profileData, source: 'supabase' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde du profil.' },
      { status: 500 }
    );
  }
}
