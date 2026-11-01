import 'server-only';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getPostgresPool } from '@/lib/postgres';

function getStorageRoot() {
  const root = process.env.PRIVATE_STORAGE_DIR;
  if (!root) throw new Error('PRIVATE_STORAGE_DIR must be configured for persistent file storage.');
  return path.resolve(root);
}

export function resolveStoredFilePath(bucket: string, relativePath: string) {
  if (!/^[a-z0-9-]+$/.test(bucket)) throw new Error('Invalid storage bucket.');
  const segments = relativePath.split('/');
  if (!segments.length || segments.some((segment) =>
    !segment || segment === '.' || segment === '..' || !/^[\w.-]+$/.test(segment)
  )) {
    throw new Error('Invalid storage path.');
  }

  const root = getStorageRoot();
  const fullPath = path.resolve(root, bucket, ...segments);
  if (!fullPath.startsWith(`${root}${path.sep}`)) throw new Error('Invalid storage path.');
  return fullPath;
}

export function getPublicStorageUrl(bucket: string, relativePath: string) {
  const safePath = relativePath.split('/').map(encodeURIComponent).join('/');
  return `/api/storage/${encodeURIComponent(bucket)}/${safePath}`;
}

export async function saveStoredFile(input: {
  bucket: string;
  relativePath: string;
  contents: Buffer;
  originalFilename: string;
  mimeType: string;
  isPublic: boolean;
  ownerUserId?: string;
}) {
  const fullPath = resolveStoredFilePath(input.bucket, input.relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, input.contents, { flag: 'wx', mode: 0o640 });

  try {
    await getPostgresPool().query(
      `INSERT INTO public.private_files
         (path, bucket, original_filename, mime_type, byte_size, is_public, owner_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        input.relativePath, input.bucket, input.originalFilename,
        input.mimeType, input.contents.byteLength, input.isPublic, input.ownerUserId ?? null,
      ],
    );
  } catch (error) {
    await rm(fullPath, { force: true });
    throw error;
  }

  return {
    path: input.relativePath,
    url: input.isPublic ? getPublicStorageUrl(input.bucket, input.relativePath) : null,
  };
}

export async function deleteStoredFile(bucket: string, relativePath: string) {
  const fullPath = resolveStoredFilePath(bucket, relativePath);
  const result = await getPostgresPool().query(
    'DELETE FROM public.private_files WHERE bucket = $1 AND path = $2 RETURNING path',
    [bucket, relativePath],
  );
  if (!result.rowCount) return false;
  await rm(fullPath, { force: true });
  return true;
}

export async function readStoredFile(bucket: string, relativePath: string) {
  const file = await getPublicStoredFileInfo(bucket, relativePath);
  if (!file) return null;
  const contents = await readFile(file.fullPath);
  return { metadata: file.metadata, contents };
}

export async function getPublicStoredFileInfo(bucket: string, relativePath: string) {
  const fullPath = resolveStoredFilePath(bucket, relativePath);
  const { rows } = await getPostgresPool().query(
    `SELECT mime_type, original_filename, byte_size
     FROM public.private_files
     WHERE bucket = $1 AND path = $2 AND is_public = TRUE`,
    [bucket, relativePath],
  );
  const metadata = rows[0];
  if (!metadata) return null;
  const fileStats = await stat(fullPath);
  return { metadata, fullPath, size: fileStats.size };
}

export async function readStoredPrivateFile(bucket: string, relativePath: string) {
  const fullPath = resolveStoredFilePath(bucket, relativePath);
  const { rows } = await getPostgresPool().query(
    `SELECT original_filename, mime_type, byte_size
     FROM public.private_files
     WHERE bucket = $1 AND path = $2 AND is_public = FALSE`,
    [bucket, relativePath],
  );
  const metadata = rows[0];
  if (!metadata) return null;
  const contents = await readFile(fullPath);
  return { metadata, contents };
}
