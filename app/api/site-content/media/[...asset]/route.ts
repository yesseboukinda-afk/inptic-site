import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { readStoredFile } from '@/lib/localStorage';
import { SITE_IMAGE_SLOTS } from '@/lib/site-content';

const BUCKET = 'site-media';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ asset: string[] }> },
) {
  const { asset } = await context.params;
  const slot = asset.join('/');
  if (!SITE_IMAGE_SLOTS.some((image) => image.path === slot)) {
    return NextResponse.json({ error: 'Photo introuvable.' }, { status: 404 });
  }

  if (process.env.DATABASE_URL) {
    try {
      const { rows } = await getPostgresPool().query<{ storage_path: string }>(
        'SELECT storage_path FROM public.site_media WHERE slot = $1',
        [slot],
      );
      const storagePath = rows[0]?.storage_path;
      if (storagePath) {
        const file = await readStoredFile(BUCKET, storagePath);
        if (!file) return NextResponse.json({ error: 'Photo introuvable dans le stockage.' }, { status: 404 });
        return imageResponse(file.contents, file.metadata.mime_type);
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
    return imageResponse(contents, getMimeType(slot));
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
    if (code !== 'ENOENT') {
      console.error('Erreur de lecture d’une photo statique:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    }
    return NextResponse.json({ error: 'Photo introuvable.' }, { status: 404 });
  }
}

function imageResponse(contents: Buffer, mimeType: string) {
  return new NextResponse(new Uint8Array(contents), {
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(contents.byteLength),
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function getMimeType(slot: string) {
  if (slot.endsWith('.jpg') || slot.endsWith('.jpeg')) return 'image/jpeg';
  if (slot.endsWith('.png')) return 'image/png';
  return 'image/webp';
}
