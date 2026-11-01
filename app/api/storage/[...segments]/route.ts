import { createReadStream } from 'node:fs';
import { NextRequest, NextResponse } from 'next/server';
import { getPublicStoredFileInfo } from '@/lib/localStorage';

const PUBLIC_BUCKETS = new Set([
  'annonces-attachments',
  'concours-docs',
  'club-news',
  'formations-catalogue',
  'publications-docs',
  'rh-photos',
  'site-media',
]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> },
) {
  const { segments } = await context.params;
  const [bucket, ...pathSegments] = segments;
  if (!bucket || !PUBLIC_BUCKETS.has(bucket) || pathSegments.length === 0) {
    return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
  }

  try {
    const file = await getPublicStoredFileInfo(bucket, pathSegments.join('/'));
    if (!file) return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });

    const range = parseByteRange(request.headers.get('range'), file.size);
    if (range === false) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Range': `bytes */${file.size}`,
          'Content-Length': '0',
        },
      });
    }

    const start = range?.start ?? 0;
    const end = range?.end ?? file.size - 1;
    const downloadName = request.nextUrl.searchParams.get('download');
    const filename = downloadName
      ? sanitizeFilename(downloadName) || file.metadata.original_filename
      : file.metadata.original_filename;
    const stream = createReadStream(file.fullPath, range ? { start, end } : undefined);

    return new NextResponse(toWebStream(stream), {
      status: range ? 206 : 200,
      headers: {
        'Content-Type': file.metadata.mime_type,
        'Content-Length': String(range ? end - start + 1 : file.size),
        'Content-Disposition': `${downloadName ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeFilename(filename)}`,
        'Accept-Ranges': 'bytes',
        ...(range ? { 'Content-Range': `bytes ${start}-${end}/${file.size}` } : {}),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Erreur de lecture du stockage local:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Stockage de fichiers indisponible.' }, { status: 503 });
  }
}

function parseByteRange(value: string | null, size: number) {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return null;

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0 || size === 0) return false;
    return { start: Math.max(size - suffixLength, 0), end: size - 1 };
  }

  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd) || start >= size || requestedEnd < start) {
    return false;
  }
  return { start, end: Math.min(requestedEnd, size - 1) };
}

function sanitizeFilename(value: string) {
  return value.replace(/[\\/]/g, '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
}

function encodeFilename(value: string) {
  return encodeURIComponent(value).replace(/['()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function toWebStream(source: ReturnType<typeof createReadStream>) {
  const iterator = source[Symbol.asyncIterator]();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();
        if (done) controller.close();
        else controller.enqueue(value);
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      source.destroy();
    },
  });
}
