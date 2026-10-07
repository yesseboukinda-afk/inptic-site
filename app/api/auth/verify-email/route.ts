import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { createAuthSessionToken, getAuthSiteUrl, hashOpaqueToken, setSessionCookie } from '@/lib/postgres-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const siteUrl = getAuthSiteUrl(request);
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return NextResponse.redirect(new URL('/candidat?authError=invalid-verification', siteUrl));
  }

  const client = await getPostgresPool().connect();
  let userId: string | null = null;
  try {
    await client.query('BEGIN');
    const found = await client.query(
      `SELECT user_id FROM public.email_verification_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       FOR UPDATE`,
      [hashOpaqueToken(token)],
    );
    if (found.rows[0]) {
      userId = found.rows[0].user_id;
      await client.query(
        'UPDATE public.email_verification_tokens SET used_at = NOW() WHERE token_hash = $1',
        [hashOpaqueToken(token)],
      );
      await client.query(
        'UPDATE public.app_users SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW() WHERE id = $1',
        [userId],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  if (!userId) {
    return NextResponse.redirect(new URL('/candidat?authError=invalid-verification', siteUrl));
  }

  const sessionToken = await createAuthSessionToken(userId);
  const response = NextResponse.redirect(new URL('/candidat?verified=1', siteUrl));
  setSessionCookie(response, sessionToken);
  return response;
}
