import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { hashOpaqueToken, hashPassword } from '@/lib/postgres-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: { token?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  const token = typeof body.token === 'string' ? body.token : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!/^[a-f0-9]{64}$/i.test(token) || password.length < 6 || password.length > 256) {
    return NextResponse.json({ error: 'Lien invalide ou mot de passe trop court.' }, { status: 400 });
  }

  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    const tokenResult = await client.query(
      `SELECT user_id FROM public.password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       FOR UPDATE`,
      [hashOpaqueToken(token)],
    );
    const userId = tokenResult.rows[0]?.user_id;
    if (!userId) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Lien invalide ou expiré. Demandez-en un nouveau.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    await client.query(
      `UPDATE public.app_users SET password_hash = $1, must_reset_password = FALSE, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, userId],
    );
    await client.query(
      'UPDATE public.password_reset_tokens SET used_at = NOW() WHERE token_hash = $1',
      [hashOpaqueToken(token)],
    );
    await client.query(
      'UPDATE public.app_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId],
    );
    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
