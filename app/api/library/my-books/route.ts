import { randomUUID } from 'node:crypto';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import { deleteStoredFile, saveStoredFile } from '@/lib/localStorage';
import { LIBRARY_FILE_BUCKET, LIBRARY_NO_STORE_HEADERS, normalizeLibraryBook } from '@/lib/library';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validId(value: string | null): value is string {
  return Boolean(value && /^[1-9]\d{0,17}$/.test(value));
}

const itemFields = `b.id, b.title, b.author, b.description, b.category, b.language, b.edition,
  b.page_count, b.legacy_file_name, b.file_path, b.legacy_cover_name, b.cover_path,
  b.download_count, b.likes_count, b.is_public, b.owner_user_id, b.created_at,
  EXISTS (SELECT 1 FROM public.library_favorites f WHERE f.user_id = $1 AND f.book_id = b.id) AS is_favorite,
  EXISTS (SELECT 1 FROM public.library_likes l WHERE l.user_id = $1 AND l.book_id = b.id) AS is_liked,
  COALESCE(p.current_page, 0) AS current_page, COALESCE(p.total_pages, 0) AS progress_pages`;

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 });
  try {
    const pool = getPostgresPool();
    const [collection, favorites, likes] = await Promise.all([
      pool.query(
        `SELECT ${itemFields}
         FROM public.library_user_books ub
         JOIN public.library_books b ON b.id = ub.book_id
         LEFT JOIN public.library_reading_progress p ON p.user_id = $1 AND p.book_id = b.id
         WHERE ub.user_id = $1 ORDER BY ub.created_at DESC`,
        [user.id],
      ),
      pool.query(
        `SELECT ${itemFields}
         FROM public.library_favorites f
         JOIN public.library_books b ON b.id = f.book_id
         LEFT JOIN public.library_reading_progress p ON p.user_id = $1 AND p.book_id = b.id
         WHERE f.user_id = $1 ORDER BY f.created_at DESC`,
        [user.id],
      ),
      pool.query(
        `SELECT ${itemFields}
         FROM public.library_likes l
         JOIN public.library_books b ON b.id = l.book_id
         LEFT JOIN public.library_reading_progress p ON p.user_id = $1 AND p.book_id = b.id
         WHERE l.user_id = $1 ORDER BY l.created_at DESC LIMIT 50`,
        [user.id],
      ),
    ]);
    const normalize = (rows: Record<string, unknown>[]) => rows.map(normalizeLibraryBook);
    return NextResponse.json({
      collection: normalize(collection.rows),
      favorites: normalize(favorites.rows),
      likes: normalize(likes.rows),
    }, { headers: LIBRARY_NO_STORE_HEADERS });
  } catch (error) {
    console.error('[Library API] Personal library query failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de charger votre bibliothèque.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 });
  if (!process.env.DATABASE_URL || !process.env.PRIVATE_STORAGE_DIR) {
    return NextResponse.json({ error: 'PostgreSQL ou le stockage persistant n’est pas configuré.' }, { status: 503 });
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Formulaire invalide.' }, { status: 400 });
  }
  const title = String(form.get('title') || '').trim();
  const author = String(form.get('author') || '').trim();
  const description = String(form.get('description') || '').trim();
  const category = String(form.get('category') || '').trim();
  const language = String(form.get('language') || '').trim();
  const edition = String(form.get('edition') || '').trim();
  const pageCount = Number(form.get('pageCount')) || 0;
  const file = form.get('file');
  if (!title || title.length > 300 || author.length > 200 || description.length > 12_000 ||
      category.length > 120 || language.length > 80 || edition.length > 120 ||
      !Number.isInteger(pageCount) || pageCount < 0 || pageCount > 100_000) {
    return NextResponse.json({ error: 'Vérifiez les champs du livre.' }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0 || file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fournissez un PDF valide (25 Mo maximum).' }, { status: 400 });
  }
  const contents = Buffer.from(await file.arrayBuffer());
  if (file.type !== 'application/pdf' || contents.subarray(0, 5).toString('ascii') !== '%PDF-') {
    return NextResponse.json({ error: 'Le fichier doit être un document PDF valide.' }, { status: 400 });
  }

  const path = `books/${randomUUID()}.pdf`;
  try {
    const saved = await saveStoredFile({
      bucket: LIBRARY_FILE_BUCKET,
      relativePath: path,
      contents,
      originalFilename: file.name.slice(0, 255) || 'livre.pdf',
      mimeType: 'application/pdf',
      isPublic: false,
      ownerUserId: user.id,
    });
    const client = await getPostgresPool().connect();
    let bookId: string;
    try {
      await client.query('BEGIN');
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO public.library_books
           (title, author, description, category, language, edition, page_count, file_path, owner_user_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
         RETURNING id`,
        [title, author, description, category, language, edition, pageCount, saved.path, user.id],
      );
      bookId = inserted.rows[0].id;
      await client.query(
        'INSERT INTO public.library_user_books (user_id, book_id) VALUES ($1, $2)',
        [user.id, bookId],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return NextResponse.json({ success: true, id: bookId }, { status: 201 });
  } catch (error) {
    await deleteStoredFile(LIBRARY_FILE_BUCKET, path).catch((cleanupError) => {
      console.error('[Library API] Personal upload cleanup failed:', cleanupError);
      return false;
    });
    console.error('[Library API] Personal book upload failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible d’ajouter ce livre à votre bibliothèque.' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 });
  const id = request.nextUrl.searchParams.get('id');
  if (!validId(id)) return NextResponse.json({ error: 'Identifiant de livre invalide.' }, { status: 400 });
  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    const removedCollection = await client.query(
      'DELETE FROM public.library_user_books WHERE user_id = $1 AND book_id = $2 RETURNING book_id',
      [user.id, id],
    );
    const owned = await client.query<{ file_path: string | null; cover_path: string | null }>(
      `DELETE FROM public.library_books
       WHERE id = $1 AND owner_user_id = $2
         AND NOT EXISTS (SELECT 1 FROM public.library_user_books WHERE book_id = $1 AND user_id <> $2)
       RETURNING file_path, cover_path`,
      [id, user.id],
    );
    await client.query('COMMIT');
    if (!removedCollection.rowCount && !owned.rowCount) {
      return NextResponse.json({ error: 'Livre introuvable dans votre bibliothèque.' }, { status: 404 });
    }
    for (const filePath of [owned.rows[0]?.file_path, owned.rows[0]?.cover_path]) {
      if (filePath) await deleteStoredFile(LIBRARY_FILE_BUCKET, filePath);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Library API] Personal book removal failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de retirer ce livre.' }, { status: 503 });
  } finally {
    client.release();
  }
}
