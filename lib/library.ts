import 'server-only';
import path from 'node:path';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { isSuperAdminRole } from '@/lib/roles';

export const LIBRARY_FILE_BUCKET = 'library';
export const LIBRARY_NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
};

export type LibraryBook = {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  language: string;
  edition: string;
  pageCount: number;
  legacyFileName: string | null;
  filePath: string | null;
  legacyCoverName: string | null;
  coverPath: string | null;
  downloadCount: number;
  isPublic: boolean;
  ownerUserId: string | null;
  createdAt: string;
  currentPage: number;
  progressPages: number;
};

export function normalizeLibraryBook(row: Record<string, unknown>): LibraryBook {
  return {
    id: String(row.id),
    title: String(row.title || ''),
    author: String(row.author || ''),
    description: String(row.description || ''),
    category: String(row.category || ''),
    language: String(row.language || ''),
    edition: String(row.edition || ''),
    pageCount: Number(row.page_count) || 0,
    legacyFileName: typeof row.legacy_file_name === 'string' ? row.legacy_file_name : null,
    filePath: typeof row.file_path === 'string' ? row.file_path : null,
    legacyCoverName: typeof row.legacy_cover_name === 'string' ? row.legacy_cover_name : null,
    coverPath: typeof row.cover_path === 'string' ? row.cover_path : null,
    downloadCount: Number(row.download_count) || 0,
    isPublic: Boolean(row.is_public),
    ownerUserId: typeof row.owner_user_id === 'string' ? row.owner_user_id : null,
    createdAt: String(row.created_at || ''),
    currentPage: Number(row.current_page) || 0,
    progressPages: Number(row.progress_pages) || 0,
  };
}

export async function authorizeLibraryAdmin(request: import('next/server').NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { error: Response.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 }) };
  }
  if (!isSuperAdminRole(user.role)) {
    return { error: Response.json({ error: 'Accès réservé au super-administrateur.' }, { status: 403 }) };
  }
  return { user };
}

export function resolveLegacyLibraryPath(kind: 'books' | 'covers', filename: string) {
  const safeName = path.basename(filename);
  const allowedExtension = kind === 'books' ? /\.pdf$/iu : /\.(jpe?g|png|webp)$/iu;
  if (safeName !== filename || filename.includes('\\') || !/^[\p{L}\p{N}_. -]+$/u.test(path.basename(safeName, path.extname(safeName))) || !allowedExtension.test(safeName)) {
    throw new Error('Invalid library asset name.');
  }
  const configured = kind === 'books' ? process.env.LIBRARY_BOOKS_DIR : process.env.LIBRARY_COVERS_DIR;
  const defaultDirectory = kind === 'books'
    ? path.join(process.cwd(), 'app', 'bibliotheque', 'livres')
    : path.join(process.cwd(), 'app', 'bibliotheque', 'images');
  const root = path.resolve(configured || defaultDirectory);
  const fullPath = path.resolve(root, safeName);
  if (!fullPath.startsWith(`${root}${path.sep}`)) throw new Error('Invalid library asset path.');
  return fullPath;
}

export function libraryFileMimeType(filename: string, cover = false) {
  if (!cover) return 'application/pdf';
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}
