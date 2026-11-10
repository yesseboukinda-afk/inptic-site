import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { getPostgresPool } from '@/lib/postgres';
import { libraryFileMimeType, LIBRARY_FILE_BUCKET, resolveLegacyLibraryPath } from '@/lib/library';
import { createLibraryReadStream } from '@/lib/library-stream';
import { resolveStoredFilePath } from '@/lib/localStorage';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    let fullPath: string;
    let filename: string;
    if (book.cover_path) {
      const { rows: stored } = await pool.query<{ original_filename: string }>(
        `SELECT original_filename FROM public.private_files
         WHERE bucket = $1 AND path = $2 AND is_public = FALSE`,
        [LIBRARY_FILE_BUCKET, book.cover_path],
      );
      if (!stored[0]) return new NextResponse(null, { status: 404 });
      filename = stored[0].original_filename;
      fullPath = resolveStoredFilePath(LIBRARY_FILE_BUCKET, book.cover_path);
    } else if (book.legacy_cover_name) {
      filename = book.legacy_cover_name;
      const candidate = resolveLegacyLibraryPath('covers', filename);
      fullPath = await realpath(candidate);
      const root = await realpath(path.resolve(process.env.LIBRARY_COVERS_DIR || path.join(process.cwd(), 'bibliotheque', 'images')));
      if (!fullPath.startsWith(`${root}${path.sep}`)) return new NextResponse(null, { status: 400 });
    } else {
      return new NextResponse(null, { status: 404 });
    }
    const fileStat = await stat(fullPath);
    if (!fileStat.isFile()) return new NextResponse(null, { status: 404 });
    return new NextResponse(createLibraryReadStream(fullPath), {
      headers: {
        'Content-Type': libraryFileMimeType(filename, true),
        'Content-Length': String(fileStat.size),
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return new NextResponse(null, { status: 404 });
    console.error('[Library API] Cover delivery failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return new NextResponse(null, { status: 503 });
  }
}
