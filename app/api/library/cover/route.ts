import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { getPostgresPool } from '@/lib/postgres';
import { libraryFileMimeType, LIBRARY_FILE_BUCKET, resolveLegacyLibraryPath } from '@/lib/library';
import { createLibraryReadStream } from '@/lib/library-stream';
import { resolveStoredFilePath } from '@/lib/localStorage';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function findLegacyCover(filename: string) {
  const defaultDirectory = path.resolve(process.cwd(), 'app', 'bibliotheque', 'images');
  const candidates = [
    { file: resolveLegacyLibraryPath('covers', filename), root: path.resolve(process.env.LIBRARY_COVERS_DIR || defaultDirectory) },
    { file: path.join(defaultDirectory, filename), root: defaultDirectory },
  ];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (seen.has(candidate.file)) continue;
    seen.add(candidate.file);
    try {
      const fullPath = await realpath(candidate.file);
      const root = await realpath(candidate.root);
      if (fullPath.startsWith(`${root}${path.sep}`)) return fullPath;
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id || !/^[1-9]\d{0,17}$/.test(id)) return new NextResponse(null, { status: 400 });
  try {
    const pool = getPostgresPool();
    const { rows } = await pool.query<{ cover_path: string | null; legacy_cover_name: string | null; is_public: boolean }>(
      'SELECT cover_path, legacy_cover_name, is_public FROM public.library_books WHERE id = $1',
      [id],
    );
    const book = rows[0];
    if (!book || !book.is_public) return new NextResponse(null, { status: 404 });
    let fullPath: string | null = null;
    let filename: string;
    if (book.cover_path) {
      const { rows: stored } = await pool.query<{ original_filename: string }>(
        `SELECT original_filename FROM public.private_files
         WHERE bucket = $1 AND path = $2 AND is_public = FALSE`,
        [LIBRARY_FILE_BUCKET, book.cover_path],
      );
      if (stored[0]) {
        filename = stored[0].original_filename;
        try {
          fullPath = await realpath(resolveStoredFilePath(LIBRARY_FILE_BUCKET, book.cover_path));
        } catch (error) {
          if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
        }
      } else {
        filename = book.legacy_cover_name || '';
      }
    } else {
      filename = book.legacy_cover_name || '';
    }
    if (!fullPath && book.legacy_cover_name) {
      filename = book.legacy_cover_name;
      fullPath = await findLegacyCover(filename);
    }
    if (!fullPath) {
      return new NextResponse(null, { status: 404 });
    }
    const fileStat = await stat(fullPath);
    if (!fileStat.isFile()) return new NextResponse(null, { status: 404 });
    return new NextResponse(createLibraryReadStream(fullPath), {
      headers: {
        'Content-Type': libraryFileMimeType(filename, true),
        'Content-Length': String(fileStat.size),
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return new NextResponse(null, { status: 404 });
    console.error('[Library API] Cover delivery failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return new NextResponse(null, { status: 503 });
  }
}
