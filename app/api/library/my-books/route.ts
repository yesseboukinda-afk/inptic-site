import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import { LIBRARY_NO_STORE_HEADERS, normalizeLibraryBook } from '@/lib/library';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validId(value: string | null): value is string {
  return Boolean(value && /^[1-9]\d{0,17}$/.test(value));
}

const itemFields = `b.id, b.title, b.author, b.description, b.category, b.language, b.edition,
  b.page_count, b.legacy_file_name, b.file_path, b.legacy_cover_name, b.cover_path,
  b.download_count, b.is_public, b.owner_user_id, b.created_at,
  COALESCE(p.current_page, 0) AS current_page, COALESCE(p.total_pages, 0) AS progress_pages`;

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 });
  try {
    const pool = getPostgresPool();
    const collection = await pool.query(
      `SELECT ${itemFields}
       FROM public.library_user_books ub
       JOIN public.library_books b ON b.id = ub.book_id
       LEFT JOIN public.library_reading_progress p ON p.user_id = $1 AND p.book_id = b.id
       WHERE ub.user_id = $1 ORDER BY ub.created_at DESC`,
      [user.id],
    );
    const normalize = (rows: Record<string, unknown>[]) => rows.map(normalizeLibraryBook);
    return NextResponse.json({
      collection: normalize(collection.rows),
    }, { headers: LIBRARY_NO_STORE_HEADERS });
  } catch (error) {
    console.error('[Library API] Personal library query failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de charger votre bibliothèque.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 });
  return NextResponse.json({ error: 'Seul le super-administrateur peut ajouter des livres au catalogue.' }, { status: 403 });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 });
  const id = request.nextUrl.searchParams.get('id');
  if (!validId(id)) return NextResponse.json({ error: 'Identifiant de livre invalide.' }, { status: 400 });
  try {
    const removedCollection = await getPostgresPool().query(
      'DELETE FROM public.library_user_books WHERE user_id = $1 AND book_id = $2 RETURNING book_id',
      [user.id, id],
    );
    if (!removedCollection.rowCount) {
      return NextResponse.json({ error: 'Livre introuvable dans votre bibliothèque.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Library API] Personal book removal failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de retirer ce livre.' }, { status: 503 });
  }
}
