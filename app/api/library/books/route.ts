import { randomUUID } from 'node:crypto';
import { getPostgresPool } from '@/lib/postgres';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { deleteStoredFile } from '@/lib/localStorage';
import { authorizeLibraryAdmin, LIBRARY_FILE_BUCKET, LIBRARY_NO_STORE_HEADERS, normalizeLibraryBook } from '@/lib/library';
import { deleteLibraryAsset, saveLibraryAsset } from '@/lib/library-assets';
import {
  filterLibraryFileCatalog,
  getLibraryFileBook,
  getLibraryFileCatalog,
  isLibraryDatabaseUnavailable,
  shouldFallbackToLibraryFiles,
  shouldUseLibraryFileCatalog,
} from '@/lib/library-file-catalog.mjs';
import { isAdminRole } from '@/lib/roles';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOOK_FIELDS = `id, title, author, description, category, language, edition, page_count,
  legacy_file_name, file_path, legacy_cover_name, cover_path, download_count, likes_count,
  is_public, owner_user_id, created_at`;

function isValidBookId(value: string | null): value is string {
  return Boolean(value && /^[1-9]\d{0,17}$/.test(value));
}

function getCatalogDiagnostic(error: unknown, stage: string) {
  const code = typeof error === 'object' && error !== null && 'code' in error
    && typeof error.code === 'string'
    ? error.code
    : '';
  const codeLabel = /^[0-9A-Z]{5}$/.test(code) ? ` (${code})` : '';
  const reason = code === '42501' ? 'droits PostgreSQL insuffisants'
    : code === '42P01' ? 'table PostgreSQL absente'
      : code === '42703' ? 'colonne PostgreSQL absente'
        : code === '3D000' ? 'base PostgreSQL introuvable'
          : code === '28P01' || code === '28000' ? 'identifiants PostgreSQL refusés'
            : code.startsWith('08') ? 'connexion PostgreSQL impossible'
              : codeLabel ? `erreur PostgreSQL${codeLabel}`
                : 'erreur de connexion ou de requête PostgreSQL';

  return `${stage} : ${reason}${codeLabel && !reason.includes(codeLabel) ? codeLabel : ''}.`;
}

async function getFileCatalogResponse(request: NextRequest) {
  const books = await getLibraryFileCatalog();
  const requestedId = request.nextUrl.searchParams.get('id');
  if (requestedId !== null) {
    if (!isValidBookId(requestedId)) {
      return NextResponse.json({ error: 'Identifiant de livre invalide.' }, { status: 400 });
    }
    const book = getLibraryFileBook(books, requestedId);
    if (!book) return NextResponse.json({ error: 'Livre introuvable.' }, { status: 404 });
    return NextResponse.json({ book }, { headers: LIBRARY_NO_STORE_HEADERS });
  }

  const params = request.nextUrl.searchParams;
  const initialValue = (params.get('initial') || 'ALL').toUpperCase();
  const initial = /^[A-Z]$/.test(initialValue) || initialValue === '#' ? initialValue : 'ALL';
  return NextResponse.json(filterLibraryFileCatalog(books, {
    search: (params.get('q') || '').trim().slice(0, 120),
    category: (params.get('category') || params.get('categorie') || '').trim().slice(0, 120),
    language: (params.get('language') || params.get('langue') || '').trim().slice(0, 80),
    author: (params.get('author') || '').trim().slice(0, 120),
    initial,
    sort: params.get('sort') || (params.get('type') === 'popular' ? 'downloads' : 'date'),
    page: Number(params.get('page')) || 1,
    limit: Number(params.get('limit')) || 24,
  }), { headers: LIBRARY_NO_STORE_HEADERS });
}

export async function GET(request: NextRequest) {
  const requestedId = request.nextUrl.searchParams.get('id');
  const search = (request.nextUrl.searchParams.get('q') || '').trim().slice(0, 120);
  const category = (request.nextUrl.searchParams.get('category') || request.nextUrl.searchParams.get('categorie') || '').trim().slice(0, 120);
  const language = (request.nextUrl.searchParams.get('language') || request.nextUrl.searchParams.get('langue') || '').trim().slice(0, 80);
  const author = (request.nextUrl.searchParams.get('author') || '').trim().slice(0, 120);
  const sortValue = request.nextUrl.searchParams.get('sort');
  const initialValue = (request.nextUrl.searchParams.get('initial') || 'ALL').toUpperCase();
  const initial = /^[A-Z]$/.test(initialValue) || initialValue === '#' ? initialValue : 'ALL';
  const requestedType = request.nextUrl.searchParams.get('type');
  const sort = ['date', 'downloads', 'likes', 'title'].includes(sortValue || '')
    ? sortValue
    : requestedType === 'popular'
      ? 'downloads'
      : 'date';
  const page = Math.max(1, Math.min(10_000, Number(request.nextUrl.searchParams.get('page')) || 1));
  const limit = Math.max(1, Math.min(48, Number(request.nextUrl.searchParams.get('limit')) || 24));
  const offset = (page - 1) * limit;
  const where: string[] = ['(b.is_public = TRUE OR b.owner_user_id = $1 OR $3 = TRUE)'];
  const visitorCookie = request.cookies.get('inptic_library_visitor')?.value || '';
  const visitorId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorCookie)
    ? visitorCookie
    : null;
  const values: unknown[] = [null, visitorId, false];
  let adminDiagnosticEnabled = false;
  let queryStage = 'authentification';

  if (shouldUseLibraryFileCatalog()) {
    try {
      return await getFileCatalogResponse(request);
    } catch (error) {
      console.error('[Library API] File catalog query failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json({ error: 'Le catalogue de la bibliothèque est indisponible.' }, {
        status: 503,
        headers: LIBRARY_NO_STORE_HEADERS,
      });
    }
  }

  try {
    const user = await getAuthenticatedUser(request);
    adminDiagnosticEnabled = Boolean(user && isAdminRole(user.role));
    queryStage = 'lecture du catalogue';
    values[0] = user?.id || null;
    const includePrivate = request.nextUrl.searchParams.get('admin') === '1' && Boolean(user && isAdminRole(user.role));
    values[2] = includePrivate;
    if (requestedId !== null) {
      if (!/^[1-9]\d{0,17}$/.test(requestedId)) {
        return NextResponse.json({ error: 'Identifiant de livre invalide.' }, { status: 400 });
      }
      const { rows } = await getPostgresPool().query(
        `SELECT b.${BOOK_FIELDS.split(', ').join(', b.')},
           EXISTS (SELECT 1 FROM public.library_favorites f WHERE f.user_id = $1 AND f.book_id = b.id) AS is_favorite,
           (EXISTS (SELECT 1 FROM public.library_likes l WHERE l.user_id = $1 AND l.book_id = b.id)
            OR EXISTS (SELECT 1 FROM public.library_guest_likes gl WHERE gl.visitor_id = $2 AND gl.book_id = b.id)) AS is_liked,
           COALESCE(p.current_page, 0) AS current_page,
           COALESCE(p.total_pages, 0) AS progress_pages
         FROM public.library_books b
         LEFT JOIN public.library_reading_progress p ON p.book_id = b.id AND p.user_id = $1
         WHERE b.id = $3 AND (b.is_public = TRUE OR b.owner_user_id = $1)`,
        [user?.id || null, visitorId, requestedId],
      );
      if (!rows[0]) return NextResponse.json({ error: 'Livre introuvable.' }, { status: 404 });
      return NextResponse.json({ book: normalizeLibraryBook(rows[0] as Record<string, unknown>) }, { headers: LIBRARY_NO_STORE_HEADERS });
    }
    if (search) {
      values.push(`%${search}%`);
      where.push(`(b.title ILIKE $${values.length} OR b.author ILIKE $${values.length} OR b.description ILIKE $${values.length})`);
    }
    if (category && category !== 'all') {
      values.push(category);
      where.push(`b.category = $${values.length}`);
    }
    if (language && language !== 'all') {
      values.push(language);
      where.push(`b.language = $${values.length}`);
    }
    if (author) {
      values.push(`%${author}%`);
      where.push(`b.author ILIKE $${values.length}`);
    }
    if (initial === '#') {
      where.push(`UPPER(LEFT(BTRIM(b.title), 1)) !~ '^[A-Z]'`);
    } else if (initial !== 'ALL') {
      const diacritics: Record<string, string> = {
        A: 'ÀÁÂÃÄÅĀĂĄ', C: 'ÇĆČ', E: 'ÈÉÊËĒĖĘ', I: 'ÌÍÎÏĪİ',
        N: 'ÑŃ', O: 'ÒÓÔÕÖØŌ', U: 'ÙÚÛÜŪ', Y: 'ÝŸ',
      };
      values.push(`^[${initial}${diacritics[initial] || ''}]`);
      where.push(`UPPER(LEFT(BTRIM(b.title), 1)) ~ $${values.length}`);
    }

    const pool = getPostgresPool();
    const whereSql = where.join(' AND ');
    const countWhereSql = whereSql.replace(/\$(\d+)/g, (placeholder, parameter: string) => {
      const index = Number(parameter);
      return index > 2 ? `$${index - 1}` : placeholder;
    });
    const countValues = [values[0], values[2], ...values.slice(3)];
    queryStage = 'comptage des ouvrages';
    const countResult = await pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM public.library_books b WHERE ${countWhereSql}`,
      countValues,
    );
    const total = Number(countResult.rows[0]?.total) || 0;
    const orderBy = sort === 'downloads' ? 'b.download_count DESC, b.created_at DESC'
      : sort === 'likes' ? 'b.likes_count DESC, b.created_at DESC'
        : sort === 'title' ? 'LOWER(b.title) ASC'
          : 'b.created_at DESC';
    queryStage = 'chargement des ouvrages';
    const rowsResult = await pool.query(
      `SELECT b.${BOOK_FIELDS.split(', ').join(', b.')},
         EXISTS (SELECT 1 FROM public.library_favorites f WHERE f.user_id = $1 AND f.book_id = b.id) AS is_favorite,
         (EXISTS (SELECT 1 FROM public.library_likes l WHERE l.user_id = $1 AND l.book_id = b.id)
          OR EXISTS (SELECT 1 FROM public.library_guest_likes gl WHERE gl.visitor_id = $2 AND gl.book_id = b.id)) AS is_liked,
         COALESCE(p.current_page, 0) AS current_page,
         COALESCE(p.total_pages, 0) AS progress_pages
       FROM public.library_books b
       LEFT JOIN public.library_reading_progress p ON p.book_id = b.id AND p.user_id = $1
       WHERE ${whereSql}
       ORDER BY ${orderBy}
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    );
    queryStage = 'chargement des filtres et statistiques';
    const [facets, totals, featured] = await Promise.all([
      pool.query(
        `SELECT ARRAY(SELECT DISTINCT category FROM public.library_books WHERE is_public AND category <> '' ORDER BY category) AS categories,
                ARRAY(SELECT DISTINCT language FROM public.library_books WHERE is_public AND language <> '' ORDER BY language) AS languages`,
      ),
      pool.query(
        `SELECT COUNT(*)::int AS books, COALESCE(SUM(download_count), 0)::bigint AS downloads
         FROM public.library_books WHERE is_public`,
      ),
      pool.query(
        `SELECT b.${BOOK_FIELDS.split(', ').join(', b.')},
           EXISTS (SELECT 1 FROM public.library_favorites f WHERE f.user_id = $1 AND f.book_id = b.id) AS is_favorite,
           (EXISTS (SELECT 1 FROM public.library_likes l WHERE l.user_id = $1 AND l.book_id = b.id)
            OR EXISTS (SELECT 1 FROM public.library_guest_likes gl WHERE gl.visitor_id = $2 AND gl.book_id = b.id)) AS is_liked,
           COALESCE(p.current_page, 0) AS current_page,
           COALESCE(p.total_pages, 0) AS progress_pages
         FROM public.library_books b
         LEFT JOIN public.library_reading_progress p ON p.book_id = b.id AND p.user_id = $1
         WHERE b.is_public = TRUE
         ORDER BY b.download_count DESC, b.created_at DESC
         LIMIT 3`,
        [values[0], values[1]],
      ),
    ]);
    return NextResponse.json({
      books: rowsResult.rows.map((row) => normalizeLibraryBook(row as Record<string, unknown>)),
      featuredBooks: featured.rows.map((row) => normalizeLibraryBook(row as Record<string, unknown>)),
      total,
      totalPublicBooks: Number(totals.rows[0]?.books) || 0,
      totalDownloads: Number(totals.rows[0]?.downloads) || 0,
      page,
      pageCount: Math.max(1, Math.ceil(total / limit)),
      categories: facets.rows[0]?.categories || [],
      languages: facets.rows[0]?.languages || [],
    }, { headers: LIBRARY_NO_STORE_HEADERS });
  } catch (error) {
    if (shouldFallbackToLibraryFiles() && isLibraryDatabaseUnavailable(error)) {
      console.warn('[Library API] PostgreSQL is unavailable; serving the file catalog.');
      try {
        return await getFileCatalogResponse(request);
      } catch (fileError) {
        console.error('[Library API] File catalog fallback failed:', fileError instanceof Error ? fileError.message : 'UNKNOWN_ERROR');
      }
    }
    console.error('[Library API] Catalog query failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({
      error: 'Le catalogue de la bibliothèque est indisponible.',
      ...(adminDiagnosticEnabled ? { diagnostic: getCatalogDiagnostic(error, queryStage) } : {}),
    }, { status: 503, headers: LIBRARY_NO_STORE_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorizeLibraryAdmin(request);
  if ('error' in auth) return auth.error;
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'PostgreSQL n’est pas configuré.' }, { status: 503 });
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
  const pdf = form.get('file');
  const cover = form.get('cover');
  if (!title || title.length > 300 || author.length > 200 || description.length > 12_000 ||
      category.length > 120 || language.length > 80 || edition.length > 120 ||
      !Number.isInteger(pageCount) || pageCount < 0 || pageCount > 100_000) {
    return NextResponse.json({ error: 'Vérifiez les champs du livre.' }, { status: 400 });
  }
  if (!(pdf instanceof File) || pdf.size === 0 || pdf.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fournissez un PDF valide (50 Mo maximum).' }, { status: 400 });
  }

  const pdfBytes = Buffer.from(await pdf.arrayBuffer());
  if (pdf.type !== 'application/pdf' || pdfBytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
    return NextResponse.json({ error: 'Le fichier doit être un document PDF valide.' }, { status: 400 });
  }
  let coverBytes: Buffer | null = null;
  let coverMime: string | null = null;
  if (cover instanceof File && cover.size > 0) {
    if (cover.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'La couverture dépasse 5 Mo.' }, { status: 400 });
    coverBytes = Buffer.from(await cover.arrayBuffer());
    if (cover.type === 'image/jpeg' && coverBytes[0] === 0xff && coverBytes[1] === 0xd8) coverMime = cover.type;
    else if (cover.type === 'image/png' && coverBytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') coverMime = cover.type;
    else if (cover.type === 'image/webp' && coverBytes.subarray(0, 4).toString('ascii') === 'RIFF' && coverBytes.subarray(8, 12).toString('ascii') === 'WEBP') coverMime = cover.type;
    else return NextResponse.json({ error: 'La couverture doit être une image JPG, PNG ou WebP valide.' }, { status: 400 });
  }

  const id = randomUUID();
  const extension = coverMime === 'image/jpeg' ? 'jpg' : coverMime === 'image/png' ? 'png' : 'webp';
  const pdfFileName = `${id}.pdf`;
  const savedAssets: Array<{ kind: 'books' | 'covers'; filename: string }> = [];
  try {
    await saveLibraryAsset('books', pdfFileName, pdfBytes);
    savedAssets.push({ kind: 'books', filename: pdfFileName });
    let coverFileName: string | null = null;
    if (coverBytes && coverMime) {
      coverFileName = `${id}.${extension}`;
      await saveLibraryAsset('covers', coverFileName, coverBytes);
      savedAssets.push({ kind: 'covers', filename: coverFileName });
    }
    const { rows } = await getPostgresPool().query(
      `INSERT INTO public.library_books
         (title, author, description, category, language, edition, page_count,
          legacy_file_name, legacy_cover_name, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, ${BOOK_FIELDS.split(', ').slice(1).join(', ')}`,
      [title, author, description, category, language, edition, pageCount, pdfFileName, coverFileName, auth.user.id],
    );
    return NextResponse.json({ book: normalizeLibraryBook(rows[0] as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    await Promise.all(savedAssets.map(async (asset) => {
      try {
        const removed = await deleteLibraryAsset(asset.kind, asset.filename);
        if (!removed) console.error('[Library API] Uploaded library asset was missing during cleanup.');
      } catch (cleanupError) {
        console.error('[Library API] Uploaded library asset cleanup failed:', cleanupError);
      }
    }));
    console.error('[Library API] Book upload failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible d’ajouter le livre au catalogue.' }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await authorizeLibraryAdmin(request);
  if ('error' in auth) return auth.error;
  let body: Record<string, unknown>;
  let cover: FormDataEntryValue | null = null;
  try {
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
      cover = form.get('cover');
    } else {
      body = await request.json();
    }
  } catch {
    return NextResponse.json({ error: 'Formulaire ou requête JSON invalide.' }, { status: 400 });
  }
  const id = typeof body.id === 'string' ? body.id : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const author = typeof body.author === 'string' ? body.author.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const language = typeof body.language === 'string' ? body.language.trim() : '';
  const edition = typeof body.edition === 'string' ? body.edition.trim() : '';
  const pageCount = Number(body.pageCount);
  if (!isValidBookId(id) || !title || title.length > 300 || author.length > 200 ||
      description.length > 12_000 || category.length > 120 || language.length > 80 ||
      edition.length > 120 || !Number.isInteger(pageCount) || pageCount < 0 || pageCount > 100_000) {
    return NextResponse.json({ error: 'Vérifiez les champs du livre.' }, { status: 400 });
  }

  let coverBytes: Buffer | null = null;
  let coverMime: string | null = null;
  if (cover instanceof File && cover.size > 0) {
    if (cover.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'La couverture dépasse 5 Mo.' }, { status: 400 });
    coverBytes = Buffer.from(await cover.arrayBuffer());
    if (cover.type === 'image/jpeg' && coverBytes[0] === 0xff && coverBytes[1] === 0xd8) coverMime = cover.type;
    else if (cover.type === 'image/png' && coverBytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') coverMime = cover.type;
    else if (cover.type === 'image/webp' && coverBytes.subarray(0, 4).toString('ascii') === 'RIFF' && coverBytes.subarray(8, 12).toString('ascii') === 'WEBP') coverMime = cover.type;
    else return NextResponse.json({ error: 'La couverture doit être une image JPG, PNG ou WebP valide.' }, { status: 400 });
  }

  const extension = coverMime === 'image/jpeg' ? 'jpg' : coverMime === 'image/png' ? 'png' : 'webp';
  let newCoverFileName: string | null = null;
  let updated = false;
  try {
    if (coverBytes && coverMime) {
      newCoverFileName = `${randomUUID()}.${extension}`;
      await saveLibraryAsset('covers', newCoverFileName, coverBytes);
    }

    const client = await getPostgresPool().connect();
    let previousCoverPath: string | null = null;
    try {
      await client.query('BEGIN');
      const existing = await client.query<{ cover_path: string | null }>(
        'SELECT cover_path FROM public.library_books WHERE id = $1 FOR UPDATE',
        [id],
      );
      if (!existing.rowCount) {
        await client.query('ROLLBACK');
        if (newCoverFileName) await deleteLibraryAsset('covers', newCoverFileName);
        return NextResponse.json({ error: 'Livre introuvable.' }, { status: 404 });
      }
      previousCoverPath = existing.rows[0].cover_path;
      await client.query(
        `UPDATE public.library_books
         SET title = $2, author = $3, description = $4, category = $5, language = $6,
             edition = $7, page_count = $8,
             cover_path = CASE WHEN $9 IS NULL THEN cover_path ELSE NULL END,
             legacy_cover_name = COALESCE($9, legacy_cover_name),
             updated_at = NOW()
         WHERE id = $1`,
        [id, title, author, description, category, language, edition, pageCount, newCoverFileName],
      );
      await client.query('COMMIT');
      updated = true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    if (newCoverFileName && previousCoverPath) {
      try {
        const removed = await deleteStoredFile(LIBRARY_FILE_BUCKET, previousCoverPath);
        if (!removed) console.error('[Library API] Replaced book cover left an orphaned stored file.');
      } catch (cleanupError) {
        console.error('[Library API] Replaced book cover cleanup failed:', cleanupError);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (newCoverFileName && !updated) {
      try {
        const removed = await deleteLibraryAsset('covers', newCoverFileName);
        if (!removed) console.error('[Library API] Failed to clean up an unused replacement cover.');
      } catch (cleanupError) {
        console.error('[Library API] Unused replacement cover cleanup failed:', cleanupError);
      }
    }
    console.error('[Library API] Book update failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de modifier ce livre.' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await authorizeLibraryAdmin(request);
  if ('error' in auth) return auth.error;
  const ids = request.nextUrl.searchParams.getAll('id')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim());
  if (!ids.length || ids.length > 100 || ids.some((id) => !isValidBookId(id))) {
    return NextResponse.json({ error: 'Sélection de livres invalide (100 maximum).' }, { status: 400 });
  }
  try {
    const result = await getPostgresPool().query(
      `DELETE FROM public.library_books
       WHERE id = ANY($1::bigint[])
       RETURNING file_path, cover_path`,
      [ids],
    );
    if (!result.rowCount) return NextResponse.json({ error: 'Aucun livre correspondant.' }, { status: 404 });
    const cleanupResults = await Promise.all(result.rows.flatMap((row) =>
      [row.file_path, row.cover_path]
        .filter((filePath): filePath is string => typeof filePath === 'string')
        .map((filePath) => deleteStoredFile(LIBRARY_FILE_BUCKET, filePath)),
    ));
    if (cleanupResults.some((deleted) => !deleted)) {
      console.error('[Library API] A deleted book left an orphaned stored file.');
      return NextResponse.json({
        success: true,
        deleted: result.rowCount,
        warning: 'Les livres ont été supprimés, mais certains fichiers doivent être nettoyés manuellement.',
      });
    }
    return NextResponse.json({ success: true, deleted: result.rowCount });
  } catch (error) {
    console.error('[Library API] Book deletion failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de supprimer ces livres.' }, { status: 503 });
  }
}
