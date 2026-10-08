import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { getAuthenticatedUser, hashPassword, verifyPassword } from '@/lib/postgres-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Session requise. Reconnecte-toi pour modifier ton compte.' }, { status: 401 });
  }

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (!currentPassword || currentPassword.length > 256) {
    return NextResponse.json({ error: 'Saisis ton mot de passe actuel.' }, { status: 400 });
  }
  if (newPassword.length < 6 || newPassword.length > 256) {
    return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir entre 6 et 256 caractères.' }, { status: 400 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ error: 'Le nouveau mot de passe doit être différent de l’actuel.' }, { status: 400 });
  }

  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    const accountResult = await client.query(
      'SELECT password_hash FROM public.app_users WHERE id = $1 FOR UPDATE',
      [user.id],
    );
    const account = accountResult.rows[0];
    if (!account || !(await verifyPassword(currentPassword, account.password_hash))) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Le mot de passe actuel est incorrect.' }, { status: 401 });
    }

    const passwordHash = await hashPassword(newPassword);
    await client.query(
      `UPDATE public.app_users
       SET password_hash = $1, must_reset_password = FALSE, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id],
    );
    await client.query(
      `UPDATE public.app_sessions SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [user.id],
    );
    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('[Account password change] PostgreSQL rollback error:', rollbackError instanceof Error ? rollbackError.message : 'UNKNOWN_ERROR');
    }
    console.error('[Account password change] PostgreSQL error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de modifier le mot de passe.' }, { status: 503 });
  } finally {
    client.release();
  }
}
