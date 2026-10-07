import { NextRequest, NextResponse } from 'next/server';
import { readStoredFile } from '@/lib/localStorage';

const PUBLIC_BUCKETS = new Set([
  'annonces-attachments',
  'concours-docs',
  'formations-catalogue',
  'publications-docs',
  'rh-photos',
]);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ segments: string[] }> },
) {
  const { segments } = await context.params;
  const [bucket, ...pathSegments] = segments;
  if (!bucket || !PUBLIC_BUCKETS.has(bucket) || pathSegments.length === 0) {
    return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
  }

  try {
    const file = await readStoredFile(bucket, pathSegments.join('/'));
    if (!file) return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
    return new NextResponse(file.contents, {
      headers: {
        'Content-Type': file.metadata.mime_type,
        'Content-Length': String(file.metadata.byte_size),
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.metadata.original_filename)}`,
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Erreur de lecture du stockage local:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Stockage de fichiers indisponible.' }, { status: 503 });
  }
}
