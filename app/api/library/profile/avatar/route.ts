import { stat } from 'node:fs/promises';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import { libraryFileMimeType, LIBRARY_FILE_BUCKET } from '@/lib/library';
import { createLibraryReadStream } from '@/lib/library-stream';
import { resolveStoredFilePath } from '@/lib/localStorage';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return new NextResponse(null, { status: 401 });
  try {
    const { rows } = await getPostgresPool().query<{ avatar_path: string }>(
      'SELECT avatar_path FROM public.library_profiles WHERE user_id = $1 AND avatar_path IS NOT NULL',
      [user.id],
    );
    const avatarPath = rows[0]?.avatar_path;
    if (!avatarPath) return new NextResponse(null, { status: 404 });
    const { rows: files } = await getPostgresPool().query<{ original_filename: string; byte_size: number }>(
      `SELECT original_filename, byte_size FROM public.private_files
       WHERE bucket = $1 AND path = $2 AND owner_user_id = $3 AND is_public = FALSE`,
      [LIBRARY_FILE_BUCKET, avatarPath, user.id],
    );
    if (!files[0]) return new NextResponse(null, { status: 404 });
    const fullPath = resolveStoredFilePath(LIBRARY_FILE_BUCKET, avatarPath);
    const fileStat = await stat(fullPath);
    return new NextResponse(createLibraryReadStream(fullPath), {
      headers: {
        'Content-Type': libraryFileMimeType(files[0].original_filename, true),
        'Content-Length': String(fileStat.size),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[Library profile API] Avatar read failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return new NextResponse(null, { status: 503 });
  }
}
