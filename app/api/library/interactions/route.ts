import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import { LIBRARY_NO_STORE_HEADERS } from '@/lib/library';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isValidBookId(value: unknown): value is string {
  return typeof value === 'string' && /^[1-9]\d{0,17}$/.test(value);
}

export async function POST(request: NextRequest) {
  let body: { action?: unknown; bookId?: unknown; currentPage?: unknown; totalPages?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête JSON invalide.' }, { status: 400 });
  }
  if (!isValidBookId(body.bookId)) return NextResponse.json({ error: 'Identifiant de livre invalide.' }, { status: 400 });
  const bookId = body.bookId;
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 });
  }

  const pool = getPostgresPool();
  try {
    const accessible = await pool.query(
      'SELECT 1 FROM public.library_books WHERE id = $1 AND (is_public = TRUE OR owner_user_id = $2)',
      [bookId, user.id],
    );
    if (!accessible.rowCount) return NextResponse.json({ error: 'Livre introuvable.' }, { status: 404 });

    if (body.action === 'progress') {
      const currentPage = Number(body.currentPage);
      const totalPages = Number(body.totalPages);
      if (!Number.isInteger(currentPage) || currentPage < 1 ||
          !Number.isInteger(totalPages) || totalPages < 0 ||
          (totalPages > 0 && currentPage > totalPages)) {
        return NextResponse.json({ error: 'Progression de lecture invalide.' }, { status: 400 });
      }
      await pool.query(
        `INSERT INTO public.library_reading_progress (user_id, book_id, current_page, total_pages)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, book_id) DO UPDATE
         SET current_page = EXCLUDED.current_page, total_pages = EXCLUDED.total_pages, updated_at = NOW()`,
        [user.id, bookId, currentPage, totalPages],
      );
      return NextResponse.json({ success: true }, { headers: LIBRARY_NO_STORE_HEADERS });
    }

    return NextResponse.json({ error: 'Action de bibliothèque inconnue.' }, { status: 400 });
  } catch (error) {
    console.error('[Library API] User interaction failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible d’enregistrer cette action.' }, { status: 503 });
  }
}
