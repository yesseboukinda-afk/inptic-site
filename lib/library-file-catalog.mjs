import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { libraryCsvField, parseLibraryCsv, safeLibraryAssetName } from './library-csv.mjs';

const ASSET_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const COLLATOR = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });

let catalogPromise;

function isWithinDirectory(file, directory) {
  const relative = path.relative(directory, file);
  return Boolean(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function isNotFound(error) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function getAssetDirectory(kind) {
  const configured = kind === 'books' ? process.env.LIBRARY_BOOKS_DIR : process.env.LIBRARY_COVERS_DIR;
  return path.resolve(configured || path.join(
    process.cwd(),
    'app',
    'bibliotheque',
    kind === 'books' ? 'livres' : 'images',
  ));
}

async function findAsset(kind, filename, optional = false) {
  try {
    const root = await realpath(getAssetDirectory(kind));
    const file = await realpath(path.resolve(root, filename));
    if (!isWithinDirectory(file, root)) throw new Error('Invalid library asset path.');
    const fileStat = await stat(file);
    return fileStat.isFile() ? file : null;
  } catch (error) {
    if (optional && isNotFound(error)) return null;
    throw error;
  }
}

function normalizeDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

async function loadLibraryFileCatalog() {
  const csvPath = path.join(process.cwd(), 'migration', 'library_books_from_pdf.csv');
  const source = await readFile(csvPath, 'utf8');
  const rows = parseLibraryCsv(source);
  const ids = new Set();
  const books = [];
  let missingPdfs = 0;

  for (const [index, row] of rows.entries()) {
    const id = libraryCsvField(row, 'id');
    const title = libraryCsvField(row, 'title', 'titre');
    const filename = safeLibraryAssetName(libraryCsvField(row, 'fichier_pdf', 'file_name', 'legacy_file_name'), '.pdf');
    if (!/^[1-9]\d{0,17}$/.test(id) || ids.has(id) || !title || title.length > 300 || !filename) {
      throw new Error(`Invalid library file catalog entry at row ${index + 2}.`);
    }
    ids.add(id);

    if (!await findAsset('books', filename)) {
      missingPdfs += 1;
      continue;
    }

    const image = libraryCsvField(row, 'image', 'cover', 'legacy_cover_name');
    const extension = path.extname(image).toLowerCase();
    const coverName = ASSET_EXTENSIONS.includes(extension) ? safeLibraryAssetName(image, extension) : null;
    const coverPath = coverName && await findAsset('covers', coverName, true) ? coverName : null;
    const pageCount = nonNegativeInteger(libraryCsvField(row, 'nb_pages', 'page_count'));
    const downloads = nonNegativeInteger(libraryCsvField(row, 'telechargements', 'download_count'));
    const likes = nonNegativeInteger(libraryCsvField(row, 'likes_count'));

    books.push({
      id,
      title,
      author: libraryCsvField(row, 'auteur', 'author'),
      description: libraryCsvField(row, 'description'),
      category: libraryCsvField(row, 'categorie', 'category'),
      language: libraryCsvField(row, 'langue', 'language'),
      edition: libraryCsvField(row, 'edition'),
      pageCount,
      legacyFileName: filename,
      filePath: null,
      legacyCoverName: coverPath,
      coverPath: null,
      downloadCount: downloads,
      likesCount: likes,
      isPublic: true,
      ownerUserId: null,
      createdAt: normalizeDate(libraryCsvField(row, 'date_ajout', 'created_at')),
      isFavorite: false,
      isLiked: false,
      currentPage: 0,
      progressPages: 0,
    });
  }

  if (missingPdfs) {
    console.warn(`[Library API] File catalog skipped ${missingPdfs} book(s) whose PDF files are missing.`);
  }
  if (!books.length) throw new Error('The library file catalog contains no books with available PDF files.');
  return books;
}

export async function getLibraryFileCatalog() {
  if (!catalogPromise) catalogPromise = loadLibraryFileCatalog();
  try {
    return await catalogPromise;
  } catch (error) {
    catalogPromise = undefined;
    throw error;
  }
}

export function getLibraryFileBook(books, id) {
  return books.find((book) => book.id === id) || null;
}

function fold(value) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr');
}

function compareBookIds(left, right) {
  return Number(right.id) - Number(left.id);
}

function compareDateDescending(left, right) {
  return (Date.parse(right.createdAt) || 0) - (Date.parse(left.createdAt) || 0) || compareBookIds(left, right);
}

export function filterLibraryFileCatalog(books, options = {}) {
  const search = fold(options.search || '');
  const category = options.category || '';
  const language = options.language || '';
  const author = fold(options.author || '');
  const initial = (options.initial || 'ALL').toUpperCase();
  const page = Math.max(1, Math.min(10_000, Number(options.page) || 1));
  const limit = Math.max(1, Math.min(48, Number(options.limit) || 24));

  const filtered = books.filter((book) => {
    if (search && !fold(`${book.title} ${book.author} ${book.description}`).includes(search)) return false;
    if (category && category !== 'all' && book.category !== category) return false;
    if (language && language !== 'all' && book.language !== language) return false;
    if (author && !fold(book.author).includes(author)) return false;
    const first = fold(book.title.trim()).charAt(0).toUpperCase();
    if (initial === '#') return !/^[A-Z]$/.test(first);
    if (initial !== 'ALL' && first !== initial) return false;
    return true;
  });

  const sort = options.sort || 'date';
  filtered.sort((left, right) => {
    if (sort === 'downloads') return right.downloadCount - left.downloadCount || compareDateDescending(left, right);
    if (sort === 'likes') return right.likesCount - left.likesCount || compareDateDescending(left, right);
    if (sort === 'title') return COLLATOR.compare(left.title, right.title) || compareBookIds(left, right);
    return compareDateDescending(left, right);
  });

  const offset = (page - 1) * limit;
  const featuredBooks = [...books]
    .sort((left, right) => right.downloadCount - left.downloadCount || compareDateDescending(left, right))
    .slice(0, 3);
  const collator = new Intl.Collator('fr', { sensitivity: 'base' });
  const categories = [...new Set(books.map((book) => book.category).filter(Boolean))].sort(collator.compare);
  const languages = [...new Set(books.map((book) => book.language).filter(Boolean))].sort(collator.compare);

  return {
    books: filtered.slice(offset, offset + limit),
    featuredBooks,
    total: filtered.length,
    totalPublicBooks: books.length,
    totalDownloads: books.reduce((total, book) => total + book.downloadCount, 0),
    page,
    pageCount: Math.max(1, Math.ceil(filtered.length / limit)),
    categories,
    languages,
  };
}

export function isLibraryDatabaseUnavailable(error) {
  const pending = [error];
  const visited = new Set();
  const unavailableCodes = new Set([
    'ECONNREFUSED',
    'ECONNRESET',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ENOTFOUND',
    'EAI_AGAIN',
    'ETIMEDOUT',
    '57P03',
  ]);

  while (pending.length) {
    const current = pending.pop();
    if (!current || (typeof current !== 'object' && typeof current !== 'function') || visited.has(current)) continue;
    visited.add(current);

    if ('code' in current && typeof current.code === 'string') {
      if (unavailableCodes.has(current.code) || current.code.startsWith('08')) return true;
    }
    if (current instanceof Error && current.message.includes('DATABASE_URL must be configured')) return true;
    if ('cause' in current) pending.push(current.cause);
    if ('errors' in current && Array.isArray(current.errors)) pending.push(...current.errors);
  }
  return false;
}

export function shouldUseLibraryFileCatalog() {
  const source = process.env.LIBRARY_CATALOG_SOURCE?.trim().toLowerCase();
  return source === 'file' || (!source && process.env.NODE_ENV === 'development');
}

export function shouldFallbackToLibraryFiles() {
  return process.env.LIBRARY_CATALOG_SOURCE?.trim().toLowerCase() !== 'database';
}
