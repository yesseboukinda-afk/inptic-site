import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { getPostgresPool } from '@/lib/postgres';
import {
  authorizeLibraryAdmin,
  LIBRARY_NO_STORE_HEADERS,
  resolveLegacyLibraryPath,
} from '@/lib/library';
import { libraryCsvField, parseLibraryCsv, safeLibraryAssetName } from '@/lib/library-csv.mjs';
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CSV_BYTES = 1_000_000;
const MAX_BOOKS = 2_000;

type ImportBook = {
  title: string;
  author: string;
  description: string;
  category: string;
  language: string;
  edition: string;
  pageCount: number;
  fileName: string;
  coverName: string | null;
};

class ImportValidationError extends Error {}

async function ensureAssetExists(kind: 'books' | 'covers', filename: string, rowNumber: number, allowMissing = false) {
  const configuredDirectory = kind === 'books' ? process.env.LIBRARY_BOOKS_DIR : process.env.LIBRARY_COVERS_DIR;
  const defaultDirectory = kind === 'books'
    ? path.join(process.cwd(), 'app', 'bibliotheque', 'livres')
    : path.join(process.cwd(), 'app', 'bibliotheque', 'images');

  try {
    const candidate = resolveLegacyLibraryPath(kind, filename);
    const [resolvedFile, resolvedRoot] = await Promise.all([
      realpath(candidate),
      realpath(path.resolve(configuredDirectory || defaultDirectory)),
    ]);
    if (!resolvedFile.startsWith(`${resolvedRoot}${path.sep}`) || !(await stat(resolvedFile)).isFile()) {
      throw new ImportValidationError(`Ligne ${rowNumber} : fichier introuvable ou chemin invalide (${filename}).`);
    }
  } catch (error) {
    if (error instanceof ImportValidationError) throw error;
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      if (allowMissing) return false;
      throw new ImportValidationError(`Ligne ${rowNumber} : fichier absent du serveur (${filename}).`);
    }
    if (error instanceof Error && error.message === 'Invalid library asset name.') {
      throw new ImportValidationError(`Ligne ${rowNumber} : nom de fichier invalide (${filename}).`);
    }
    throw error;
  }
  return true;
}

function parseImportRows(text: string): ImportBook[] {
  let rows: ReturnType<typeof parseLibraryCsv>;
  try {
    rows = parseLibraryCsv(text);
  } catch (error) {
    throw new ImportValidationError(error instanceof Error ? error.message : 'Le CSV est invalide.');
  }
  if (!rows.length) throw new ImportValidationError('Le CSV ne contient aucun livre.');
  if (rows.length > MAX_BOOKS) throw new ImportValidationError(`Le CSV dépasse la limite de ${MAX_BOOKS} ouvrages.`);

  const firstRow = rows[0];
  if (!('title' in firstRow || 'titre' in firstRow)) {
    throw new ImportValidationError('Colonne requise manquante : title ou titre.');
  }
  if (!('fichier_pdf' in firstRow || 'file_name' in firstRow || 'filename' in firstRow)) {
    throw new ImportValidationError('Colonne requise manquante : fichier_pdf, file_name ou filename.');
  }

  const filenames = new Set<string>();
  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const title = libraryCsvField(row, 'title', 'titre').slice(0, 300);
    const rawFilename = libraryCsvField(row, 'fichier_pdf', 'file_name', 'filename');
    const fileName = safeLibraryAssetName(rawFilename, '.pdf');
    const rawCover = libraryCsvField(row, 'image', 'cover');
    const coverName = rawCover
      ? safeLibraryAssetName(rawCover, path.extname(rawCover).toLowerCase())
      : null;
    const parsedPageCount = libraryCsvField(row, 'nb_pages', 'page_count');
    const pageCount = parsedPageCount && /^\d+$/.test(parsedPageCount) ? Number(parsedPageCount) : 0;

    if (!title) throw new ImportValidationError(`Ligne ${rowNumber} : le titre est obligatoire.`);
    if (!fileName) throw new ImportValidationError(`Ligne ${rowNumber} : nom de PDF invalide.`);
    if (filenames.has(fileName.toLowerCase())) {
      throw new ImportValidationError(`Ligne ${rowNumber} : le PDF ${fileName} apparaît plusieurs fois.`);
    }
    if (rawCover && !coverName) throw new ImportValidationError(`Ligne ${rowNumber} : nom de couverture invalide.`);
    if (pageCount > 100_000) throw new ImportValidationError(`Ligne ${rowNumber} : nombre de pages trop élevé.`);

    filenames.add(fileName.toLowerCase());
    return {
      title,
      author: libraryCsvField(row, 'auteur', 'author').slice(0, 200),
      description: libraryCsvField(row, 'description').slice(0, 12_000),
      category: libraryCsvField(row, 'categorie', 'category').slice(0, 120),
      language: libraryCsvField(row, 'langue', 'language').slice(0, 80),
      edition: libraryCsvField(row, 'edition').slice(0, 120),
      pageCount,
      fileName,
      coverName,
    };
  });
}

async function importBooks(client: PoolClient, books: ImportBook[], updateExisting: boolean) {
  let inserted = 0;
  let updated = 0;

  await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [3_412_025_110]);
  for (const book of books) {
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM public.library_books
       WHERE legacy_file_name = $1 AND file_path IS NULL
       ORDER BY id LIMIT 1 FOR UPDATE`,
      [book.fileName],
    );
    if (existing.rows[0]) {
      if (updateExisting) {
        await client.query(
          `UPDATE public.library_books
           SET title = $2,
               author = CASE WHEN $3 <> '' THEN $3 ELSE author END,
               description = CASE WHEN $4 <> '' THEN $4 ELSE description END,
               category = CASE WHEN $5 <> '' THEN $5 ELSE category END,
               language = CASE WHEN $6 <> '' THEN $6 ELSE language END,
               edition = CASE WHEN $7 <> '' THEN $7 ELSE edition END,
               page_count = CASE WHEN $8 > 0 THEN $8 ELSE page_count END,
               legacy_cover_name = COALESCE($9, legacy_cover_name), is_public = TRUE,
               updated_at = NOW()
           WHERE id = $1`,
          [
            existing.rows[0].id, book.title, book.author, book.description, book.category,
            book.language, book.edition, book.pageCount, book.coverName,
          ],
        );
        updated += 1;
      }
      continue;
    }

    await client.query(
      `INSERT INTO public.library_books
         (title, author, description, category, language, edition, page_count,
          legacy_file_name, legacy_cover_name, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)`,
      [
        book.title, book.author, book.description, book.category, book.language, book.edition,
        book.pageCount, book.fileName, book.coverName,
      ],
    );
    inserted += 1;
  }
  return { inserted, updated };
}

export async function POST(request: NextRequest) {
  const auth = await authorizeLibraryAdmin(request);
  if ('error' in auth) return auth.error;

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_CSV_BYTES + 16_384) {
    return NextResponse.json({ error: 'Le fichier CSV dépasse la limite de 1 Mo.' }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Formulaire d’import invalide.' }, { status: 400 });
  }
  const importSource = form.get('source') === 'repository';
  const file = form.get('file');
  if (!importSource && (!(file instanceof File) || !file.name.toLowerCase().endsWith('.csv'))) {
    return NextResponse.json({ error: 'Sélectionnez un fichier CSV.' }, { status: 400 });
  }
  if (!importSource && file instanceof File && file.size > MAX_CSV_BYTES) {
    return NextResponse.json({ error: 'Le fichier CSV dépasse la limite de 1 Mo.' }, { status: 413 });
  }

  let books: ImportBook[];
  let skippedMissing = 0;
  try {
    let csv: string;
    if (importSource) {
      csv = await readFile(path.join(process.cwd(), 'migration', 'library_books_from_pdf.csv'), 'utf8');
    } else if (file instanceof File) {
      csv = await file.text();
    } else {
      return NextResponse.json({ error: 'Sélectionnez un fichier CSV.' }, { status: 400 });
    }
    const parsedBooks = parseImportRows(csv);
    books = [];
    for (let index = 0; index < parsedBooks.length; index += 1) {
      const book = parsedBooks[index];
      if (!await ensureAssetExists('books', book.fileName, index + 2, importSource)) {
        skippedMissing += 1;
        continue;
      }
      if (book.coverName) await ensureAssetExists('covers', book.coverName, index + 2);
      books.push(book);
    }
    if (!books.length) throw new ImportValidationError('Aucun PDF source disponible à synchroniser.');
  } catch (error) {
    if (error instanceof ImportValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: LIBRARY_NO_STORE_HEADERS });
    }
    console.error('[Library import API] Source catalog validation failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de lire ou vérifier les fichiers de la bibliothèque.' }, { status: 503 });
  }

  let client: PoolClient;
  try {
    client = await getPostgresPool().connect();
  } catch (error) {
    console.error('[Library import API] Database connection failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de se connecter à la base de données.' }, { status: 503 });
  }

  let transactionStarted = false;
  try {
    await client.query('BEGIN');
    transactionStarted = true;
    const result = await importBooks(client, books, !importSource);
    await client.query('COMMIT');
    transactionStarted = false;
    return NextResponse.json({ ...result, total: books.length, skippedMissing }, { headers: LIBRARY_NO_STORE_HEADERS });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('[Library import API] Rollback failed:', rollbackError instanceof Error ? rollbackError.message : 'UNKNOWN_ERROR');
      }
    }
    console.error('[Library import API] Transaction failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'L’import a échoué et aucun changement n’a été enregistré.' }, { status: 503 });
  } finally {
    client.release();
  }
}
