import { randomUUID } from 'node:crypto';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import { deleteStoredFile, saveStoredFile } from '@/lib/localStorage';
import { LIBRARY_FILE_BUCKET, LIBRARY_NO_STORE_HEADERS } from '@/lib/library';
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 });
  try {
    const { rows } = await getPostgresPool().query(
      `SELECT COALESCE(p.display_name, u.user_metadata->>'full_name', u.user_metadata->>'name', '') AS display_name,
              COALESCE(p.bio, '') AS bio, p.birth_date, (p.avatar_path IS NOT NULL) AS has_avatar, u.email
       FROM public.app_users u
       LEFT JOIN public.library_profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [user.id],
    );
    return NextResponse.json({ profile: rows[0] || { display_name: '', bio: '', birth_date: null, has_avatar: false } }, {
      headers: LIBRARY_NO_STORE_HEADERS,
    });
  } catch (error) {
    console.error('[Library profile API] Profile query failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de charger votre profil.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 });
  if (!process.env.PRIVATE_STORAGE_DIR || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'PostgreSQL ou le stockage persistant n’est pas configuré.' }, { status: 503 });
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Formulaire invalide.' }, { status: 400 });
  }
  const displayName = String(form.get('displayName') || '').trim();
  const bio = String(form.get('bio') || '').trim();
  const birthDateValue = String(form.get('birthDate') || '').trim();
  const parsedBirthDate = birthDateValue ? new Date(`${birthDateValue}T00:00:00.000Z`) : null;
  const removeAvatar = form.get('removeAvatar') === 'true';
  const avatar = form.get('avatar');
  if (displayName.length > 160 || bio.length > 2000 ||
      (birthDateValue && (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateValue) ||
        !parsedBirthDate || Number.isNaN(parsedBirthDate.getTime()) ||
        parsedBirthDate.toISOString().slice(0, 10) !== birthDateValue))) {
    return NextResponse.json({ error: 'Vérifiez les informations du profil.' }, { status: 400 });
  }

  let avatarPath: string | null = null;
  let uploadedPath: string | null = null;
  if (avatar instanceof File && avatar.size > 0) {
    if (avatar.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'La photo dépasse 5 Mo.' }, { status: 413 });
    const contents = Buffer.from(await avatar.arrayBuffer());
    const mimeType = avatar.type === 'image/jpeg' && contents[0] === 0xff && contents[1] === 0xd8
      ? 'image/jpeg'
      : avatar.type === 'image/png' && contents.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
        ? 'image/png'
        : avatar.type === 'image/webp' && contents.subarray(0, 4).toString('ascii') === 'RIFF' && contents.subarray(8, 12).toString('ascii') === 'WEBP'
          ? 'image/webp'
          : '';
    if (!mimeType) return NextResponse.json({ error: 'La photo doit être une image JPG, PNG ou WebP valide.' }, { status: 400 });
    uploadedPath = `avatars/${user.id}_${randomUUID()}.${mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/png' ? 'png' : 'webp'}`;
    try {
      const saved = await saveStoredFile({
        bucket: LIBRARY_FILE_BUCKET,
        relativePath: uploadedPath,
        contents,
        originalFilename: avatar.name.slice(0, 255) || 'avatar',
        mimeType,
        isPublic: false,
        ownerUserId: user.id,
      });
      avatarPath = saved.path;
    } catch (error) {
      console.error('[Library profile API] Avatar upload failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json({ error: 'Impossible d’enregistrer votre photo.' }, { status: 503 });
    }
  }

  let client: PoolClient | undefined;
  let transactionStarted = false;
  let committed = false;
  try {
    client = await getPostgresPool().connect();
    await client.query('BEGIN');
    transactionStarted = true;
    const previous = await client.query<{ avatar_path: string | null }>(
      'SELECT avatar_path FROM public.library_profiles WHERE user_id = $1 FOR UPDATE',
      [user.id],
    );
    const previousPath = previous.rows[0]?.avatar_path || null;
    const nextAvatarPath = avatarPath || (removeAvatar ? null : previousPath);
    await client.query(
      `INSERT INTO public.library_profiles (user_id, display_name, bio, birth_date, avatar_path, updated_at)
       VALUES ($1, $2, $3, NULLIF($4, '')::date, $5, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name, bio = EXCLUDED.bio,
           birth_date = EXCLUDED.birth_date, avatar_path = EXCLUDED.avatar_path, updated_at = NOW()`,
      [user.id, displayName, bio, birthDateValue, nextAvatarPath],
    );
    await client.query('COMMIT');
    transactionStarted = false;
    committed = true;
    if (previousPath && previousPath !== nextAvatarPath) {
      await deleteStoredFile(LIBRARY_FILE_BUCKET, previousPath).catch((cleanupError) => {
        console.error('[Library profile API] Previous avatar cleanup failed:', cleanupError);
        return false;
      });
    }
    return NextResponse.json({ success: true }, { headers: LIBRARY_NO_STORE_HEADERS });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('[Library profile API] Profile rollback failed:', rollbackError);
      }
    }
    if (uploadedPath && !committed) {
      await deleteStoredFile(LIBRARY_FILE_BUCKET, uploadedPath).catch((cleanupError) => {
        console.error('[Library profile API] Avatar rollback cleanup failed:', cleanupError);
        return false;
      });
    }
    console.error('[Library profile API] Profile update failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible d’enregistrer votre profil.' }, { status: 503 });
  } finally {
    client?.release();
  }
}
