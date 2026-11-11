import { readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { libraryCsvField as field, parseLibraryCsv as parseCsv, safeLibraryAssetName as safeLegacyName } from '../lib/library-csv.mjs';

const { Pool } = pg;

async function loadCsv(filename, label, required = false) {
  if (!filename) {
    if (required) throw new Error(`Le chemin du CSV ${label} est requis.`);
    return [];
  }
  const content = await readFile(filename, 'utf8');
  return parseCsv(content);
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL doit pointer vers PostgreSQL.');
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 2) {
    const key = process.argv[index];
    const value = process.argv[index + 1];
    if (key?.startsWith('--') && value) args.set(key.slice(2), path.resolve(value));
  }
  const books = await loadCsv(args.get('books'), 'livres', true);
  const users = await loadCsv(args.get('users'), 'utilisateurs');
  const favorites = await loadCsv(args.get('favorites'), 'favoris');
  const likes = await loadCsv(args.get('likes'), 'likes');
  const collection = await loadCsv(args.get('collection'), 'user_livres');
  const progress = await loadCsv(args.get('progress'), 'progression_lecture');
  if (!books.length) throw new Error('Le CSV livres est vide ou ne contient pas de ligne de titre.');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const client = await pool.connect();
  const bookIds = new Set();
  const userIds = new Map();
  const missingEmails = new Set();
  let importedBooks = 0;
  let skippedBooks = 0;

  try {
    await client.query('BEGIN');
    const emails = [...new Set(users.map((row) => field(row, 'email', 'courriel').toLowerCase()).filter(Boolean))];
    if (emails.length) {
      const { rows } = await client.query(
        'SELECT id, email FROM public.app_users WHERE lower(email) = ANY($1::text[])',
        [emails],
      );
      const byEmail = new Map(rows.map((row) => [row.email.toLowerCase(), row.id]));
      for (const row of users) {
        const oldId = field(row, 'id', 'user_id');
        const email = field(row, 'email', 'courriel').toLowerCase();
        const newId = byEmail.get(email);
        if (oldId && newId) {
          userIds.set(oldId, newId);
          const displayName = [field(row, 'prenom', 'first_name'), field(row, 'nom', 'last_name')]
            .filter(Boolean)
            .join(' ')
            .slice(0, 160);
          const birthDateValue = field(row, 'date_naissance', 'birth_date');
          const birthDate = /^\d{4}-\d{2}-\d{2}$/.test(birthDateValue) &&
            !Number.isNaN(Date.parse(`${birthDateValue}T00:00:00.000Z`)) &&
            new Date(`${birthDateValue}T00:00:00.000Z`).toISOString().slice(0, 10) === birthDateValue
            ? birthDateValue
            : null;
          await client.query(
            `INSERT INTO public.library_profiles (user_id, display_name, bio, birth_date)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO NOTHING`,
            [newId, displayName, field(row, 'bio').slice(0, 2000), birthDate],
          );
        } else if (email) missingEmails.add(email);
      }
    }

    for (const row of books) {
      const oldId = field(row, 'id', 'livre_id');
      const title = field(row, 'title', 'titre').slice(0, 300);
      const legacyFile = safeLegacyName(field(row, 'fichier_pdf', 'file_name', 'filename'), '.pdf');
      if (!/^\d+$/.test(oldId) || !title || !legacyFile) {
        skippedBooks += 1;
        continue;
      }
      const pages = Math.max(0, Math.min(100_000, Number.parseInt(field(row, 'nb_pages', 'page_count'), 10) || 0));
      const downloads = Math.max(0, Number.parseInt(field(row, 'telechargements', 'downloads'), 10) || 0);
      const likesCount = Math.max(0, Number.parseInt(field(row, 'likes_count'), 10) || 0);
      const date = field(row, 'date_ajout', 'created_at');
      const createdAt = date && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString() : null;
      const coverName = safeLegacyName(field(row, 'image', 'cover'), '.jpg')
        || safeLegacyName(field(row, 'image', 'cover'), '.jpeg')
        || safeLegacyName(field(row, 'image', 'cover'), '.png')
        || safeLegacyName(field(row, 'image', 'cover'), '.webp');
      await client.query(
        `INSERT INTO public.library_books
           (id, title, author, description, category, language, edition, page_count,
            legacy_file_name, legacy_cover_name, download_count, likes_count, is_public, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE, COALESCE($13::timestamptz, NOW()), NOW())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, author = EXCLUDED.author, description = EXCLUDED.description,
           category = EXCLUDED.category, language = EXCLUDED.language, edition = EXCLUDED.edition,
           page_count = EXCLUDED.page_count, legacy_file_name = EXCLUDED.legacy_file_name,
           legacy_cover_name = EXCLUDED.legacy_cover_name, download_count = EXCLUDED.download_count,
           likes_count = EXCLUDED.likes_count, is_public = TRUE, updated_at = NOW()`,
        [
          oldId, title, field(row, 'auteur', 'author').slice(0, 200),
          field(row, 'description').slice(0, 12_000), field(row, 'categorie', 'category').slice(0, 120),
          field(row, 'langue', 'language').slice(0, 80), field(row, 'edition').slice(0, 120),
          pages, legacyFile, coverName, downloads, likesCount, createdAt,
        ],
      );
      bookIds.add(oldId);
      importedBooks += 1;
    }

    if (importedBooks) {
      await client.query(
        `SELECT setval(pg_get_serial_sequence('public.library_books', 'id'),
          GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.library_books), 1), TRUE)`,
      );
    }

    async function importAssociations(rows, table, withCreatedAt = false) {
      let imported = 0;
      for (const row of rows) {
        const oldBookId = field(row, 'livre_id', 'book_id');
        const oldUserId = field(row, 'user_id', 'utilisateur_id');
        const userId = userIds.get(oldUserId);
        if (!userId || !bookIds.has(oldBookId)) continue;
        const createdAt = field(row, 'created_at', 'date_ajout');
        const validDate = createdAt && !Number.isNaN(Date.parse(createdAt)) ? new Date(createdAt).toISOString() : null;
        if (withCreatedAt) {
          await client.query(
            `INSERT INTO public.${table} (user_id, book_id, created_at)
             VALUES ($1, $2, COALESCE($3::timestamptz, NOW())) ON CONFLICT DO NOTHING`,
            [userId, oldBookId, validDate],
          );
        } else {
          await client.query(
            `INSERT INTO public.${table} (user_id, book_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [userId, oldBookId],
          );
        }
        imported += 1;
      }
      return imported;
    }

    const importedCollection = await importAssociations(collection, 'library_user_books', true);
    const importedFavorites = await importAssociations(favorites, 'library_favorites', true);
    const importedLikes = await importAssociations(likes, 'library_likes', true);
    let importedProgress = 0;
    for (const row of progress) {
      const oldBookId = field(row, 'livre_id', 'book_id');
      const userId = userIds.get(field(row, 'user_id', 'utilisateur_id'));
      if (!userId || !bookIds.has(oldBookId)) continue;
      const currentPage = Math.max(1, Number.parseInt(field(row, 'page_courante', 'current_page'), 10) || 1);
      const totalPages = Math.max(0, Number.parseInt(field(row, 'nb_pages', 'total_pages'), 10) || 0);
      await client.query(
        `INSERT INTO public.library_reading_progress (user_id, book_id, current_page, total_pages)
         VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, book_id) DO UPDATE
         SET current_page = EXCLUDED.current_page, total_pages = EXCLUDED.total_pages`,
        [userId, oldBookId, currentPage, totalPages],
      );
      importedProgress += 1;
    }
    if (likes.length) {
      await client.query(
        `UPDATE public.library_books b SET likes_count = (
          SELECT COUNT(*) FROM public.library_likes l WHERE l.book_id = b.id
        ) WHERE b.id = ANY($1::bigint[])`,
        [[...bookIds]],
      );
    }
    await client.query('COMMIT');

    console.log(JSON.stringify({
      importedBooks,
      skippedBooks,
      importedCollection,
      importedFavorites,
      importedLikes,
      importedProgress,
      usersWithoutMatchingSiteAccount: missingEmails.size,
    }, null, 2));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Import bibliothèque échoué.');
  process.exitCode = 1;
});
