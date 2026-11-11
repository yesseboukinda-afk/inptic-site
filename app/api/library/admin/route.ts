import { getPostgresPool } from '@/lib/postgres';
import { authorizeLibraryAdmin, LIBRARY_NO_STORE_HEADERS } from '@/lib/library';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await authorizeLibraryAdmin(request);
  if ('error' in auth) return auth.error;
  try {
    const { rows } = await getPostgresPool().query(
      `SELECT
         (SELECT COUNT(*)::int FROM public.library_books) AS books,
         (SELECT COUNT(*)::int FROM public.app_users) AS users,
         (SELECT COALESCE(SUM(download_count), 0)::bigint FROM public.library_books) AS downloads,
         (SELECT COUNT(*)::int FROM public.library_favorites) AS favorites,
         (SELECT COALESCE(SUM(likes_count), 0)::bigint FROM public.library_books) AS likes`,
    );
    return NextResponse.json({ stats: rows[0] }, { headers: LIBRARY_NO_STORE_HEADERS });
  } catch (error) {
    console.error('[Library admin API] Statistics query failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Statistiques de la bibliothèque indisponibles.' }, { status: 503 });
  }
}
