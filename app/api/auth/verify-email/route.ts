import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { createAuthSessionToken, getAuthSiteUrl, hashOpaqueToken, setSessionCookie } from '@/lib/postgres-auth';

export const runtime = 'nodejs';

async function siteAuditedGET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const siteUrl = getAuthSiteUrl(request);
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return NextResponse.redirect(new URL('/candidat?authError=invalid-verification', siteUrl));
  }

  const client = await getPostgresPool().connect();
  let userId: string | null = null;
  let emailChanged = false;
  let emailConflict = false;
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
      const accountResult = await client.query(
        'SELECT email, user_metadata FROM public.app_users WHERE id = $1 FOR UPDATE',
        [userId],
      );
      const account = accountResult.rows[0];
      const pendingEmail = typeof account?.user_metadata?.pending_email === 'string'
        ? account.user_metadata.pending_email.trim().toLowerCase()
        : '';
      emailChanged = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pendingEmail) && pendingEmail !== account.email;

      await client.query(
        'UPDATE public.email_verification_tokens SET used_at = NOW() WHERE token_hash = $1',
        [hashOpaqueToken(token)],
      );
      if (emailChanged) {
        const accountConflict = await client.query(
          'SELECT 1 FROM public.app_users WHERE email = $1 AND id <> $2 LIMIT 1',
          [pendingEmail, userId],
        );
        const profileConflict = await client.query(
          'SELECT 1 FROM public.profiles WHERE lower(email) = $1 AND lower(email) <> lower($2) LIMIT 1',
          [pendingEmail, account.email],
        );
        if (accountConflict.rowCount || profileConflict.rowCount) {
          await client.query('ROLLBACK');
          userId = null;
          emailConflict = true;
        } else {
          await client.query(
            `UPDATE public.profiles
             SET email = $1, updated_at = NOW()
             WHERE lower(email) = lower($2)`,
            [pendingEmail, account.email],
          );
          await client.query(
            `UPDATE public.concours_preinscriptions
             SET email = $1 WHERE user_id = $2`,
            [pendingEmail, userId],
          );
          await client.query(
            `UPDATE public.rh_profiles
             SET email = $1, updated_at = NOW()
             WHERE lower(email) = lower($2)`,
            [pendingEmail, account.email],
          );
          await client.query(
            `UPDATE public.app_users
             SET email = $1, email_verified_at = NOW(),
                 user_metadata = user_metadata - 'pending_email',
                 updated_at = NOW()
             WHERE id = $2`,
            [pendingEmail, userId],
          );
          await client.query(
            `UPDATE public.app_sessions SET revoked_at = NOW()
             WHERE user_id = $1 AND revoked_at IS NULL`,
            [userId],
          );
        }
      } else {
        await client.query(
          'UPDATE public.app_users SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW() WHERE id = $1',
          [userId],
        );
      }
    }
    if (userId) await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (code === '23505') {
      emailConflict = true;
      userId = null;
    } else {
      throw error;
    }
  } finally {
    client.release();
  }

  if (!userId) {
    if (emailConflict) {
      return NextResponse.redirect(new URL('/candidat?authError=email-change-conflict', siteUrl));
    }
    return NextResponse.redirect(new URL('/candidat?authError=invalid-verification', siteUrl));
  }

  const sessionToken = await createAuthSessionToken(userId);
  const verificationUrl = new URL('/candidat?verified=1', siteUrl);
  if (emailChanged) verificationUrl.searchParams.set('emailChanged', '1');
  const response = NextResponse.redirect(verificationUrl);
  setSessionCookie(response, sessionToken);
  return response;
}

export const GET = withSiteAudit(
  'Vérification d’adresse e-mail',
  siteAuditedGET,
  (response) => {
    const location = response.headers.get('location');
    return Boolean(location && new URL(location).searchParams.get('verified') === '1');
  },
);
