export function parseLibraryCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  const input = text.replace(/^\uFEFF/, '');

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"' && value === '') {
      quoted = true;
    } else if (character === ',') {
      row.push(value);
      value = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error('Le CSV contient un champ entre guillemets non terminé.');
  if (value || row.length) {
    row.push(value);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  if (headers.some((header) => !header) || new Set(headers).size !== headers.length) {
    throw new Error('Le CSV contient un en-tête vide ou en double.');
  }

  return rows.slice(1).map((cells) => {
    if (cells.length > headers.length) throw new Error('Le CSV contient une ligne avec trop de colonnes.');
    return Object.fromEntries(headers.map((header, index) => [header, (cells[index] || '').trim()]));
  });
}

export function libraryCsvField(row, ...names) {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && value !== '') return value;
  }
  return '';
}

export function safeLibraryAssetName(value, extension) {
  const filename = value.trim();
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
  if (
    !allowedExtensions.includes(extension.toLowerCase()) ||
    !filename ||
    filename !== filename.split(/[\\/]/).at(-1) ||
    !new RegExp(`\\.${extension.replace('.', '')}$`, 'iu').test(filename) ||
    !/^[\p{L}\p{N}_. -]+$/u.test(filename.slice(0, -extension.length))
  ) {
    return null;
  }
  return filename;
}
