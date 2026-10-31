import { randomUUID } from 'node:crypto';
import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { authorizeSuperAdminRequest } from '@/lib/staff-storage';
import { deleteStoredFile, saveStoredFile } from '@/lib/localStorage';
import { getPostgresPool as getDatabasePool } from '@/lib/postgres';
import { SITE_IMAGE_SLOTS } from '@/lib/site-content';

const BUCKET = 'site-media';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

type AllowedImageType = keyof typeof IMAGE_TYPES;

async function siteAuditedPOST(request: NextRequest) {
  const auth = await authorizeSuperAdminRequest(request);
  if (auth.error) return auth.error;
  if (!process.env.DATABASE_URL || !process.env.PRIVATE_STORAGE_DIR) {
    return NextResponse.json({ error: 'PostgreSQL ou le stockage persistant n’est pas configuré.' }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Formulaire de téléversement invalide.' }, { status: 400 });
  }

  const slot = formData.get('slot');
  const file = formData.get('file');
  if (typeof slot !== 'string' || !SITE_IMAGE_SLOTS.some((image) => image.path === slot)) {
    return NextResponse.json({ error: 'Emplacement photo invalide.' }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Sélectionnez une image à téléverser.' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'La taille maximale d’une image est de 10 Mo.' }, { status: 413 });
  }

  const contents = Buffer.from(await file.arrayBuffer());
  const detectedType = detectImageType(contents);
  if (!detectedType || (file.type && file.type !== detectedType)) {
    return NextResponse.json({ error: 'Formats acceptés : JPEG, PNG ou WebP valides.' }, { status: 400 });
  }

  const path = `${slot.replace(/\.[^.]+$/, '')}/${Date.now()}_${randomUUID()}.${IMAGE_TYPES[detectedType]}`;
  let savedPath: string | null = null;
  let previousPath: string | null = null;
  let committed = false;
  const client = await getDatabasePool().connect();
  try {
    const saved = await saveStoredFile({
      bucket: BUCKET,
      relativePath: path,
      contents,
      originalFilename: file.name.slice(0, 200) || `image.${IMAGE_TYPES[detectedType]}`,
      mimeType: detectedType,
      isPublic: true,
      ownerUserId: auth.user.id,
    });
    savedPath = saved.path;

    await client.query('BEGIN');
    const existing = await client.query<{ storage_path: string }>(
      'SELECT storage_path FROM public.site_media WHERE slot = $1 FOR UPDATE',
      [slot],
    );
    previousPath = existing.rows[0]?.storage_path ?? null;
    await client.query(
      `INSERT INTO public.site_media (slot, storage_path, updated_by, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (slot) DO UPDATE
       SET storage_path = EXCLUDED.storage_path, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [slot, saved.path, auth.user.id],
    );
    await client.query('COMMIT');
    committed = true;
  } catch (error) {
    if (!committed) {
      await client.query('ROLLBACK').catch((rollbackError: unknown) => {
        console.error('Impossible d’annuler la mise à jour d’une photo:', rollbackError);
      });
    }
    console.error('Erreur lors de l’enregistrement d’une photo du site:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    if (savedPath && !committed) {
      await deleteStoredFile(BUCKET, savedPath).catch((cleanupError: unknown) => {
        console.error('Impossible de supprimer la photo temporaire:', cleanupError);
      });
    }
    return NextResponse.json({ error: 'Enregistrement de la photo impossible.' }, { status: 503 });
  } finally {
    client.release();
  }

  if (previousPath && previousPath !== savedPath) {
    try {
      await deleteStoredFile(BUCKET, previousPath);
    } catch (error) {
      console.error('La photo remplacée n’a pas pu être nettoyée:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    }
  }

  return NextResponse.json({ success: true, slot }, { status: 200 });
}

function detectImageType(contents: Buffer): AllowedImageType | null {
  if (
    contents.length >= 3 &&
    contents[0] === 0xff &&
    contents[1] === 0xd8 &&
    contents[2] === 0xff
  ) return 'image/jpeg';
  if (
    contents.length >= 8 &&
    contents.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) return 'image/png';
  if (
    contents.length >= 12 &&
    contents.toString('ascii', 0, 4) === 'RIFF' &&
    contents.toString('ascii', 8, 12) === 'WEBP'
  ) return 'image/webp';
  return null;
}

export const POST = withSiteAudit('Remplacement d’une photo du site', siteAuditedPOST);
