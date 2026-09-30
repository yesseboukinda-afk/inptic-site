import { NextRequest, NextResponse } from 'next/server';
import {
  isAdminAccountEmail,
  isAdminRole,
  isCommunicationRole,
  isDirectorAccountEmail,
  isDirectorRole,
  normalizeRole,
} from '@/lib/roles';
import { supabaseAdmin } from '@/lib/supabase';

export type StoredAttachment = {
  name: string;
  url: string;
  size: number;
  type: string;
  path: string;
};

export async function authorizeStaffRequest(request: NextRequest, forbiddenMessage: string) {
  const accessToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return { error: NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 }) };
  }

  if (!supabaseAdmin) {
    return {
      error: NextResponse.json(
        { error: 'Configuration serveur Supabase manquante (SUPABASE_SERVICE_ROLE_KEY).' },
        { status: 500 }
      ),
    };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    return { error: NextResponse.json({ error: 'Session expirée ou invalide.' }, { status: 401 }) };
  }

  const role = normalizeRole(
    data.user.app_metadata?.role ??
      data.user.app_metadata?.roles ??
      data.user.user_metadata?.role ??
      data.user.user_metadata?.roles
  );
  const email = data.user.email || '';

  const isAuthorized =
    isAdminRole(role) ||
    isDirectorRole(role) ||
    isCommunicationRole(role) ||
    role === 'scolarite' ||
    role === 'direction_etudes' ||
    isAdminAccountEmail(email) ||
    isDirectorAccountEmail(email);

  if (!isAuthorized) {
    return { error: NextResponse.json({ error: forbiddenMessage }, { status: 403 }) };
  }

  return { user: data.user };
}

async function ensureBucket(bucket: string) {
  if (!supabaseAdmin) return;
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.id === bucket || b.name === bucket);
    if (!exists) {
      await supabaseAdmin.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 15 * 1024 * 1024,
      });
    }
  } catch (e) {
    console.warn('Bucket ensure notice:', e);
  }
}

export async function uploadStaffFiles(request: NextRequest, bucket: string, folder: string) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin non configuré.' }, { status: 500 });
  }

  try {
    await ensureBucket(bucket);
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
    }

    const uploaded: StoredAttachment[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const ext = file.name.split('.').pop() || 'bin';
      const cleanBase = file.name
        .substring(0, file.name.lastIndexOf('.') || file.name.length)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .slice(0, 40);
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const filePath = `${folder}/${uniqueSuffix}_${cleanBase}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const { data, error } = await supabaseAdmin.storage.from(bucket).upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

      if (error) {
        throw new Error(`Erreur lors de l'envoi de ${file.name} : ${error.message}`);
      }

      const { data: pubData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);

      uploaded.push({
        name: file.name,
        url: pubData.publicUrl,
        size: file.size,
        type: file.type || ext,
        path: data.path,
      });
    }

    return NextResponse.json({ data: uploaded }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur inconnue lors du téléversement.' },
      { status: 500 }
    );
  }
}

export async function deleteStaffFile(request: NextRequest, bucket: string) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin non configuré.' }, { status: 500 });
  }

  const path = request.nextUrl.searchParams.get('path');
  if (!path) {
    return NextResponse.json({ error: 'Chemin du fichier requis.' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur de suppression du fichier.' },
      { status: 500 }
    );
  }
}
