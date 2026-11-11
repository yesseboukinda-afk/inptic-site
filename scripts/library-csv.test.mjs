import assert from 'node:assert/strict';
import test from 'node:test';
import { libraryCsvField, parseLibraryCsv, safeLibraryAssetName } from '../lib/library-csv.mjs';
import {
  filterLibraryFileCatalog,
  isLibraryDatabaseUnavailable,
} from '../lib/library-file-catalog.mjs';

test('parses UTF-8 BOM, escaped quotes, and embedded newlines', () => {
  const rows = parseLibraryCsv('\uFEFFtitle,author\r\n"Book, ""Two""","A. Author\nSecond line"\r\n');
  assert.deepEqual(rows, [{ title: 'Book, "Two"', author: 'A. Author\nSecond line' }]);
});

test('rejects malformed or ambiguous CSV headers and rows', () => {
  assert.throws(() => parseLibraryCsv('title,title\none,two\n'), /en-tête vide ou en double/);
  assert.throws(() => parseLibraryCsv('title\n"unfinished'), /champ entre guillemets non terminé/);
  assert.throws(() => parseLibraryCsv('title\none,two\n'), /trop de colonnes/);
});

test('reads CSV aliases and accepts only safe, supported asset names', () => {
  assert.equal(libraryCsvField({ titre: 'Book' }, 'title', 'titre'), 'Book');
  assert.equal(safeLibraryAssetName('école 2.pdf', '.pdf'), 'école 2.pdf');
  assert.equal(safeLibraryAssetName('../secret.pdf', '.pdf'), null);
  assert.equal(safeLibraryAssetName('cover.exe', '.exe'), null);
  assert.equal(safeLibraryAssetName('cover.jpg', '.jpg'), 'cover.jpg');
});

test('file catalog preserves search, filter, initial, sort, and pagination controls', () => {
  const books = [
    { id: '1', title: 'École du numérique', author: 'Marie Nguema', description: '', category: 'Web', language: 'fr', createdAt: '', downloadCount: 3, likesCount: 0 },
    { id: '2', title: '42 exercices', author: 'Auteur', description: '', category: 'Maths', language: 'fr', createdAt: '', downloadCount: 0, likesCount: 0 },
    { id: '3', title: 'Alpha', author: 'Auteur', description: '', category: 'Web', language: 'en', createdAt: '', downloadCount: 1, likesCount: 0 },
    { id: '4', title: 'Bravo', author: 'Auteur', description: '', category: 'Web', language: 'en', createdAt: '', downloadCount: 2, likesCount: 0 },
  ];

  const search = filterLibraryFileCatalog(books, {
    search: 'ecole',
    author: 'marie',
    category: 'Web',
    language: 'fr',
    initial: 'E',
    sort: 'title',
  });
  assert.deepEqual(search.books.map((book) => book.id), ['1']);

  const page = filterLibraryFileCatalog(books, { sort: 'title', page: 2, limit: 2 });
  assert.deepEqual(page.books.map((book) => book.id), ['4', '1']);
  assert.equal(page.pageCount, 2);

  const nonAlphabetic = filterLibraryFileCatalog(books, { initial: '#', limit: 48 });
  assert.deepEqual(nonAlphabetic.books.map((book) => book.id), ['2']);
});

test('recognizes database connectivity failures but not query errors', () => {
  assert.equal(isLibraryDatabaseUnavailable(Object.assign(new Error('refused'), { code: 'ECONNREFUSED' })), true);
  assert.equal(isLibraryDatabaseUnavailable(Object.assign(new Error('missing table'), { code: '42P01' })), false);
});
