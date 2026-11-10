import 'server-only';
import { getPostgresPool } from '@/lib/postgres';

type MobileBookOptions = {
  type?: string;
  query?: string;
  category?: string;
  language?: string;
  limit?: number;
};

export async function getMobileLibraryBooks(options: MobileBookOptions) {
  const values: unknown[] = [];
  const filters = ['is_public = TRUE'];
  const query = options.query?.trim().slice(0, 120);
  const category = options.category?.trim().slice(0, 120);
  const language = options.language?.trim().slice(0, 80);

  if (query) {
    values.push(`%${query}%`);
    filters.push(`(title ILIKE $${values.length} OR author ILIKE $${values.length} OR description ILIKE $${values.length})`);
  }
  if (category && category !== 'all' && category !== 'Toutes catégories') {
    values.push(category);
    filters.push(`category = $${values.length}`);
  }
  if (language && language !== 'all' && language !== 'Toutes langues') {
    values.push(language);
    filters.push(`language = $${values.length}`);
  }

  const limit = Math.max(1, Math.min(50, Math.trunc(options.limit || 10)));
  const orderBy = options.type === 'popular' ? 'download_count DESC, created_at DESC' : 'created_at DESC';
  values.push(limit);
  const { rows } = await getPostgresPool().query(
    `SELECT id, title, author, category, language, description, cover_path, legacy_cover_name,
            file_path, legacy_file_name, download_count, created_at
     FROM public.library_books
     WHERE ${filters.join(' AND ')}
     ORDER BY ${orderBy}
     LIMIT $${values.length}`,
    values,
  );

  return rows.map((book) => ({
    id: String(book.id),
    titre: book.title,
    auteur: book.author,
    categorie: book.category,
    langue: book.language,
    description: book.description,
    couverture_url: book.cover_path || book.legacy_cover_name ? `/api/library/cover?id=${book.id}` : null,
    pdf_url: book.file_path || book.legacy_file_name ? `/api/library/file?id=${book.id}` : null,
    telechargements: Number(book.download_count) || 0,
    date_ajout: book.created_at,
  }));
}
