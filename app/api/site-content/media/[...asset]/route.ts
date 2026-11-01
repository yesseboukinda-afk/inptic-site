import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { resolveStoredFilePath } from '@/lib/localStorage';
import { SITE_IMAGE_SLOTS } from '@/lib/site-content';

const BUCKET = 'site-media';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ asset: string[] }> },
) {
  const { asset } = await context.params;
  const slot = asset.join('/');
  if (!SITE_IMAGE_SLOTS.some((image) => image.path === slot)) {
    return NextResponse.json({ error: 'Photo introuvable.' }, { status: 404 });
  }

  if (process.env.DATABASE_URL) {
    try {
      const { rows } = await getPostgresPool().query<{
        storage_path: string;
        mime_type: string | null;
      }>(
        `SELECT media.storage_path, stored_file.mime_type
         FROM public.site_media AS media
         LEFT JOIN public.private_files AS stored_file
           ON stored_file.bucket = $2
          AND stored_file.path = media.storage_path
          AND stored_file.is_public = TRUE
         WHERE media.slot = $1`,
        [slot, BUCKET],
      );
      const media = rows[0];
      if (media?.storage_path) {
        const { storage_path: storagePath, mime_type: mimeType } = media;
        if (!mimeType) {
          return NextResponse.json({ error: 'Photo introuvable dans le stockage.' }, { status: 404 });
        }
        const etag = createImageEtag(storagePath);
        if (matchesIfNoneMatch(request.headers.get('if-none-match'), etag)) {
          return notModifiedResponse(etag);
        }
        const contents = await readFile(resolveStoredFilePath(BUCKET, storagePath));
        return imageResponse(contents, mimeType, etag);
      }
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
      if (code !== '42P01') {
        console.error('Erreur PostgreSQL lors du chargement d’une photo:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
        return NextResponse.json({ error: 'Stockage des photos indisponible.' }, { status: 503 });
      }
    }
  }

  try {
    const filePath = path.join(process.cwd(), 'public', ...asset);
    const contents = await readFile(filePath);
    const etag = createImageEtag(contents);
    if (matchesIfNoneMatch(request.headers.get('if-none-match'), etag)) {
      return notModifiedResponse(etag);
    }
    return imageResponse(contents, getMimeType(slot), etag);
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
    if (code !== 'ENOENT') {
      console.error('Erreur de lecture d’une photo statique:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    }
    return NextResponse.json({ error: 'Photo introuvable.' }, { status: 404 });
  }
}

function imageResponse(contents: Buffer, mimeType: string, etag: string) {
  return new NextResponse(new Uint8Array(contents), {
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(contents.byteLength),
      'Cache-Control': 'public, max-age=0, s-maxage=0, must-revalidate',
      ETag: etag,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function notModifiedResponse(etag: string) {
  return new NextResponse(null, {
    status: 304,
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=0, must-revalidate',
      ETag: etag,
    },
  });
}

function createImageEtag(value: string | Buffer) {
  return `"${createHash('sha256').update(value).digest('hex')}"`;
}

function matchesIfNoneMatch(header: string | null, etag: string) {
  return header
    ?.split(',')
    .map((value) => value.trim())
    .some((value) => value === '*' || value === etag || value === `W/${etag}`) ?? false;
}

function getMimeType(slot: string) {
  if (slot.endsWith('.jpg') || slot.endsWith('.jpeg')) return 'image/jpeg';
  if (slot.endsWith('.png')) return 'image/png';
  return 'image/webp';
}
