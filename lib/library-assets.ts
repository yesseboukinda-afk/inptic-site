import { mkdir, open, realpath, unlink } from 'node:fs/promises';
import path from 'node:path';
import { resolveLegacyLibraryPath } from '@/lib/library';

type LibraryAssetKind = 'books' | 'covers';

function getLibraryAssetDirectory(kind: LibraryAssetKind) {
  const configured = kind === 'books' ? process.env.LIBRARY_BOOKS_DIR : process.env.LIBRARY_COVERS_DIR;
  return path.resolve(configured || path.join(
    process.cwd(),
    'app',
    'bibliotheque',
    kind === 'books' ? 'livres' : 'images',
  ));
}

async function getSafeLibraryAssetPath(kind: LibraryAssetKind, filename: string, createDirectory = false) {
  const configuredPath = resolveLegacyLibraryPath(kind, filename);
  const directory = getLibraryAssetDirectory(kind);
  if (createDirectory) await mkdir(directory, { recursive: true });
  const root = await realpath(directory);
  const fullPath = path.resolve(root, path.basename(configuredPath));
  if (!fullPath.startsWith(`${root}${path.sep}`)) throw new Error('Invalid library asset path.');
  return fullPath;
}

export async function saveLibraryAsset(kind: LibraryAssetKind, filename: string, contents: Buffer) {
  const fullPath = await getSafeLibraryAssetPath(kind, filename, true);
  let created = false;
  try {
    const file = await open(fullPath, 'wx', 0o640);
    created = true;
    try {
      await file.writeFile(contents);
    } finally {
      await file.close();
    }
  } catch (error) {
    if (created) {
      try {
        await unlink(fullPath);
      } catch (cleanupError) {
        console.error('[Library API] Failed to remove a partial library asset:', cleanupError);
      }
    }
    throw error;
  }
  return filename;
}

export async function deleteLibraryAsset(kind: LibraryAssetKind, filename: string) {
  const fullPath = await getSafeLibraryAssetPath(kind, filename);
  try {
    await unlink(fullPath);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
}
