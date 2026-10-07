import { NextRequest, NextResponse } from 'next/server';
import {
  isAdminRole,
  isCommunicationRole,
  isDirectorRole,
  normalizeRole,
} from '@/lib/roles';
import { deleteStoredFile, getPublicStorageUrl, saveStoredFile } from '@/lib/localStorage';
import { getAuthenticatedUser } from '@/lib/postgres-auth';

export type StoredAttachment = {
  name: string;
  url: string;
  size: number;
  type: string;
  path: string;
};

export async function authorizeStaffRequest(request: NextRequest, forbiddenMessage: string) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 }) };
  }

  const role = normalizeRole(user.role);

  const isAuthorized =
    isAdminRole(role) ||
    isDirectorRole(role) ||
    isCommunicationRole(role) ||
    role === 'scolarite' ||
    role === 'direction_etudes';

  if (!isAuthorized) {
    return { error: NextResponse.json({ error: forbiddenMessage }, { status: 403 }) };
  }

  return { user };
}

export async function uploadStaffFiles(request: NextRequest, bucket: string, folder: string) {
  if (!process.env.DATABASE_URL || !process.env.PRIVATE_STORAGE_DIR) {
    return NextResponse.json({ error: 'PostgreSQL ou le stockage persistant n’est pas configuré.' }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
    }

    const uploaded: StoredAttachment[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;
      if (file.size > 15 * 1024 * 1024) {
        return NextResponse.json({ error: `Le fichier ${file.name} dépasse la limite de 15 Mo.` }, { status: 413 });
      }

      const ext = (file.name.split('.').pop() || 'bin').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'bin';
      const cleanBase = file.name
        .substring(0, file.name.lastIndexOf('.') || file.name.length)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .slice(0, 40);
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const filePath = `${folder}/${uniqueSuffix}_${cleanBase}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const mimeType = file.type || 'application/octet-stream';
      const saved = await saveStoredFile({
        bucket,
        relativePath: filePath,
        contents: buffer,
        originalFilename: file.name,
        mimeType,
        isPublic: true,
      });

      uploaded.push({
        name: file.name,
        url: saved.url || getPublicStorageUrl(bucket, saved.path),
        size: file.size,
        type: mimeType,
        path: saved.path,
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
  if (!process.env.DATABASE_URL || !process.env.PRIVATE_STORAGE_DIR) {
    return NextResponse.json({ error: 'PostgreSQL ou le stockage persistant n’est pas configuré.' }, { status: 503 });
  }

  const path = request.nextUrl.searchParams.get('path');
  if (!path) {
    return NextResponse.json({ error: 'Chemin du fichier requis.' }, { status: 400 });
  }

  try {
    const deleted = await deleteStoredFile(bucket, path);
    if (!deleted) return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur de suppression du fichier.' },
      { status: 500 }
    );
  }
}
