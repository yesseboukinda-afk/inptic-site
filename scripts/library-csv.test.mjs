import assert from 'node:assert/strict';
import test from 'node:test';
import { libraryCsvField, parseLibraryCsv, safeLibraryAssetName } from '../lib/library-csv.mjs';

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
