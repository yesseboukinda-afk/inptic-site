import { randomUUID } from 'node:crypto';
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
  if (!user && body.action !== 'like') {
    return NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 });
  }

  const pool = getPostgresPool();
  try {
    if (body.action === 'like') {
      const cookieValue = request.cookies.get('inptic_library_visitor')?.value;
      const visitorId = user
        ? null
        : cookieValue && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cookieValue)
          ? cookieValue
          : randomUUID();
      const table = user ? 'library_likes' : 'library_guest_likes';
      const identityColumn = user ? 'user_id' : 'visitor_id';
      const identity = user?.id || visitorId;
      const client = await pool.connect();
      let active = false;
      try {
        await client.query('BEGIN');
        const accessible = await client.query(
          `SELECT 1 FROM public.library_books
           WHERE id = $1 AND (is_public = TRUE OR owner_user_id = $2)
           FOR UPDATE`,
          [bookId, user?.id || null],
        );
        if (!accessible.rowCount) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Livre introuvable.' }, { status: 404 });
        }

        const removed = await client.query(
          `DELETE FROM public.${table} WHERE ${identityColumn} = $1 AND book_id = $2 RETURNING book_id`,
          [identity, bookId],
        );
        if (removed.rowCount) {
          await client.query(
            `UPDATE public.library_books
             SET likes_count = GREATEST(0, likes_count - 1), updated_at = NOW()
             WHERE id = $1`,
            [bookId],
          );
        } else {
          const inserted = await client.query(
            `INSERT INTO public.${table} (${identityColumn}, book_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING book_id`,
            [identity, bookId],
          );
          active = Boolean(inserted.rowCount);
          if (active) {
            await client.query(
              `UPDATE public.library_books
               SET likes_count = likes_count + 1, updated_at = NOW()
               WHERE id = $1`,
              [bookId],
            );
          }
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      const count = await pool.query<{ likes_count: number }>(
        'SELECT likes_count::int FROM public.library_books WHERE id = $1',
        [bookId],
      );
      const response = NextResponse.json({
        active,
        likesCount: Number(count.rows[0]?.likes_count) || 0,
      }, { headers: LIBRARY_NO_STORE_HEADERS });
      if (!user && visitorId && (!cookieValue || visitorId !== cookieValue)) {
        response.cookies.set('inptic_library_visitor', visitorId, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
        });
      }
      return response;
    }

    const accessible = await pool.query(
      'SELECT 1 FROM public.library_books WHERE id = $1 AND (is_public = TRUE OR owner_user_id = $2)',
      [bookId, user!.id],
    );
    if (!accessible.rowCount) return NextResponse.json({ error: 'Livre introuvable.' }, { status: 404 });

    if (body.action === 'favorite') {
      const table = 'library_favorites';
      const removed = await pool.query(
        `DELETE FROM public.${table} WHERE user_id = $1 AND book_id = $2 RETURNING book_id`,
        [user!.id, bookId],
      );
      const active = removed.rowCount
        ? false
        : Boolean((await pool.query(
            `INSERT INTO public.${table} (user_id, book_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING book_id`,
            [user!.id, bookId],
          )).rowCount);

      return NextResponse.json({ active }, { headers: LIBRARY_NO_STORE_HEADERS });
    }

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
        [user!.id, bookId, currentPage, totalPages],
      );
      return NextResponse.json({ success: true }, { headers: LIBRARY_NO_STORE_HEADERS });
    }

    if (body.action === 'collection') {
      const result = await pool.query(
        `INSERT INTO public.library_user_books (user_id, book_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING book_id`,
        [user!.id, bookId],
      );
      return NextResponse.json({ added: Boolean(result.rowCount) }, { headers: LIBRARY_NO_STORE_HEADERS });
    }

    return NextResponse.json({ error: 'Action de bibliothèque inconnue.' }, { status: 400 });
  } catch (error) {
    console.error('[Library API] User interaction failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible d’enregistrer cette action.' }, { status: 503 });
  }
}
