import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import { libraryFileMimeType, LIBRARY_FILE_BUCKET, LIBRARY_NO_STORE_HEADERS, resolveLegacyLibraryPath } from '@/lib/library';
import { createLibraryReadStream } from '@/lib/library-stream';
import { resolveStoredFilePath } from '@/lib/localStorage';
import { isAdminRole } from '@/lib/roles';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isValidId(value: string | null): value is string {
  return Boolean(value && /^[1-9]\d{0,17}$/.test(value));
}

function fileResponse(
  request: NextRequest,
  fullPath: string,
  size: number,
  filename: string,
  download: boolean,
  onComplete?: () => Promise<void>,
) {
  const range = request.headers.get('range');
  let start = 0;
  let end = size - 1;
  let status = 200;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
    if (!match[1]) {
      const suffixLength = Number(match[2]);
      start = Math.max(0, size - suffixLength);
    } else {
      start = Number(match[1]);
      if (match[2]) end = Math.min(end, Number(match[2]));
    }
    if (start >= size || start > end) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
    status = 206;
  }

  const headers = new Headers(LIBRARY_NO_STORE_HEADERS);
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Accept-Ranges', 'bytes');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(filename)}`);
  if (status === 206) headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  return new NextResponse(createLibraryReadStream(fullPath, { start, end }, onComplete), { status, headers });
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!isValidId(id)) return NextResponse.json({ error: 'Identifiant de livre invalide.' }, { status: 400 });
  try {
    const pool = getPostgresPool();
    const { rows } = await pool.query<{
      title: string;
      file_path: string | null;
      legacy_file_name: string | null;
      is_public: boolean;
      owner_user_id: string | null;
    }>(
      `SELECT title, file_path, legacy_file_name, is_public, owner_user_id
       FROM public.library_books WHERE id = $1`,
      [id],
    );
    const book = rows[0];
    if (!book) return NextResponse.json({ error: 'Livre introuvable.' }, { status: 404 });
    if (!book.is_public) {
      const user = await getAuthenticatedUser(request);
      if (!user || (user.id !== book.owner_user_id && !isAdminRole(user.role))) {
        return NextResponse.json({ error: 'Ce document est privé.' }, { status: 403 });
      }
    }

    let fullPath: string;
    if (book.file_path) {
      const { rows: storedRows } = await pool.query<{ original_filename: string; byte_size: number }>(
        `SELECT original_filename, byte_size FROM public.private_files
         WHERE bucket = $1 AND path = $2 AND is_public = FALSE`,
        [LIBRARY_FILE_BUCKET, book.file_path],
      );
      if (!storedRows[0]) return NextResponse.json({ error: 'Fichier du livre introuvable.' }, { status: 404 });
      fullPath = resolveStoredFilePath(LIBRARY_FILE_BUCKET, book.file_path);
    } else if (book.legacy_file_name) {
      const configuredPath = resolveLegacyLibraryPath('books', book.legacy_file_name);
      fullPath = await realpath(configuredPath);
      const root = await realpath(path.resolve(process.env.LIBRARY_BOOKS_DIR || path.join(process.cwd(), 'app', 'bibliotheque', 'livres')));
      if (!fullPath.startsWith(`${root}${path.sep}`)) return NextResponse.json({ error: 'Chemin de fichier invalide.' }, { status: 400 });
    } else {
      return NextResponse.json({ error: 'Fichier du livre indisponible.' }, { status: 404 });
    }

    const fileStat = await stat(fullPath);
    if (!fileStat.isFile()) return NextResponse.json({ error: 'Fichier du livre introuvable.' }, { status: 404 });
    const download = request.nextUrl.searchParams.get('download') === '1';
    const filename = `${book.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 120) || 'livre'}.pdf`;
    return fileResponse(
      request,
      fullPath,
      fileStat.size,
      filename,
      download,
      download && !request.headers.has('range')
        ? async () => {
            try {
              await pool.query('UPDATE public.library_books SET download_count = download_count + 1 WHERE id = $1', [id]);
            } catch (error) {
              console.error('[Library API] Completed download count update failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
              throw error;
            }
          }
        : undefined,
    );
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Fichier du livre introuvable sur le serveur.' }, { status: 404 });
    }
    console.error('[Library API] PDF delivery failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de lire ce document.' }, { status: 503 });
  }
}
