import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { deleteStoredFile, getPublicStorageUrl, saveStoredFile } from '@/lib/localStorage';
import { getPostgresPool } from '@/lib/postgres';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { CLUBS, findClub } from '@/lib/clubs';
import { isStandardAdminRole, isSuperAdminRole, normalizeStaffService } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STORAGE_BUCKET = 'club-news';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

function managerClub(user: Awaited<ReturnType<typeof getAuthenticatedUser>>) {
  if (!user) return null;
  if (isSuperAdminRole(user.role)) return 'all';
  const service = normalizeStaffService(user.user_metadata.service ?? user.user_metadata.department);
  const clubSlug = user.user_metadata.clubSlug;
  if (isStandardAdminRole(user.role) && service === 'clubs' && findClub(clubSlug)) return clubSlug;
  return null;
}

function imageExtension(contents: Buffer) {
  if (contents.length >= 3 && contents[0] === 0xff && contents[1] === 0xd8 && contents[2] === 0xff) return 'jpg';
  if (
    contents.length >= 8 &&
    contents.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) return 'png';
  if (
    contents.length >= 12 &&
    contents.toString('ascii', 0, 4) === 'RIFF' &&
    contents.toString('ascii', 8, 12) === 'WEBP'
  ) return 'webp';
  return null;
}

function unavailable(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
    ? error.code
    : '';
  const message = code === '42P01'
    ? 'Le fil d’actualité des clubs n’est pas encore installé. Exécutez scripts/23_club_news_feed.sql.'
    : code === '42501'
      ? 'Le compte PostgreSQL du site n’a pas les droits requis. Exécutez scripts/23_club_news_feed.sql.'
      : code
        ? `Erreur PostgreSQL pour le fil des clubs (code ${code}).`
        : 'Le service de stockage des photos des clubs est indisponible.';
  console.error('[Club news API] PostgreSQL/storage error:', code || 'UNKNOWN_ERROR', error instanceof Error ? error.message : '');
  return NextResponse.json({ error: message }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request: NextRequest) {
  const clubSlug = request.nextUrl.searchParams.get('club');
  if (clubSlug && !findClub(clubSlug)) {
    return NextResponse.json({ error: 'Club invalide.' }, { status: 400 });
  }

  try {
    const { rows } = await getPostgresPool().query(
      `SELECT posts.id, posts.club_slug AS "clubSlug", posts.caption,
              posts.image_path AS "imagePath", posts.created_at AS "createdAt",
              COALESCE(
                NULLIF(BTRIM(users.user_metadata->>'full_name'), ''),
                NULLIF(BTRIM(users.user_metadata->>'name'), ''),
                'Responsable du club'
              ) AS "authorName"
       FROM public.club_news_posts AS posts
       JOIN public.app_users AS users ON users.id = posts.created_by
       WHERE ($1::text IS NULL OR posts.club_slug = $1)
       ORDER BY posts.created_at DESC
       LIMIT 100`,
      [clubSlug],
    );
    return NextResponse.json(
      {
        posts: rows.map(({ imagePath, ...post }) => ({
          ...post,
          imageUrl: getPublicStorageUrl(STORAGE_BUCKET, imagePath),
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return unavailable(error);
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  const assignment = managerClub(user);
  if (!user || !assignment) {
    return NextResponse.json({ error: 'Seuls les responsables des clubs peuvent publier des photos.' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Formulaire de publication invalide.' }, { status: 400 });
  }
  const clubSlug = formData.get('clubSlug');
  const captionValue = formData.get('caption');
  const image = formData.get('image');
  const club = findClub(clubSlug);
  if (!club || (assignment !== 'all' && assignment !== club.slug)) {
    return NextResponse.json({ error: 'Vous ne pouvez publier que pour le club qui vous est attribué.' }, { status: 403 });
  }
  if (typeof captionValue !== 'string' || captionValue.trim().length > 500) {
    return NextResponse.json({ error: 'La légende ne peut pas dépasser 500 caractères.' }, { status: 400 });
  }
  if (!(image instanceof File)) {
    return NextResponse.json({ error: 'Choisissez une photo à publier.' }, { status: 400 });
  }
  if (image.size === 0 || image.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: 'La photo doit peser entre 1 octet et 5 Mo.' }, { status: 413 });
  }
  if (!IMAGE_TYPES.has(image.type)) {
    return NextResponse.json({ error: 'Formats acceptés : JPG, PNG et WebP.' }, { status: 415 });
  }

  const contents = Buffer.from(await image.arrayBuffer());
  const extension = imageExtension(contents);
  if (!extension || IMAGE_TYPES.get(image.type) !== extension) {
    return NextResponse.json({ error: 'Le contenu du fichier ne correspond pas à une photo JPG, PNG ou WebP valide.' }, { status: 415 });
  }
  const safeFilename = image.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'photo';
  const imagePath = `${club.slug}/${randomUUID()}-${safeFilename}.${extension}`;

  try {
    await saveStoredFile({
      bucket: STORAGE_BUCKET,
      relativePath: imagePath,
      contents,
      originalFilename: image.name.slice(0, 200) || `photo.${extension}`,
      mimeType: image.type,
      isPublic: true,
      ownerUserId: user.id,
    });
    const { rows } = await getPostgresPool().query(
      `INSERT INTO public.club_news_posts (club_slug, caption, image_path, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, club_slug AS "clubSlug", caption, created_at AS "createdAt"`,
      [club.slug, captionValue.trim(), imagePath, user.id],
    );
    return NextResponse.json(
      { post: { ...rows[0], imageUrl: getPublicStorageUrl(STORAGE_BUCKET, imagePath) } },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    await deleteStoredFile(STORAGE_BUCKET, imagePath).catch((cleanupError) => {
      console.error('[Club news API] Uploaded image cleanup failed:', cleanupError);
    });
    return unavailable(error);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  const assignment = managerClub(user);
  if (!user || !assignment) {
    return NextResponse.json({ error: 'Seuls les responsables des clubs peuvent supprimer une publication.' }, { status: 403 });
  }
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Identifiant de publication requis.' }, { status: 400 });

  try {
    const { rows } = await getPostgresPool().query<{ clubSlug: string; imagePath: string }>(
      `SELECT club_slug AS "clubSlug", image_path AS "imagePath"
       FROM public.club_news_posts WHERE id = $1`,
      [id],
    );
    const post = rows[0];
    if (!post) return NextResponse.json({ error: 'Publication introuvable.' }, { status: 404 });
    if (assignment !== 'all' && assignment !== post.clubSlug) {
      return NextResponse.json({ error: 'Vous ne pouvez supprimer que les publications de votre club.' }, { status: 403 });
    }

    const removedFile = await deleteStoredFile(STORAGE_BUCKET, post.imagePath);
    if (!removedFile) {
      await getPostgresPool().query('DELETE FROM public.club_news_posts WHERE id = $1', [id]);
    }
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return unavailable(error);
  }
}
