import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { createAuthSession, getAuthSiteUrl } from '@/lib/postgres-auth';

export const runtime = 'nodejs';

type OAuthIdentity = { email: string; name: string; picture: string };

export async function GET(request: NextRequest) {
  const siteUrl = getAuthSiteUrl(request);
  const callbackError = request.nextUrl.searchParams.get('error');
  const code = request.nextUrl.searchParams.get('code');
  const returnedState = request.nextUrl.searchParams.get('state') || '';
  const storedState = request.cookies.get('inptic_oauth_state')?.value || '';
  const [provider, state] = storedState.split(':', 2);

  if (callbackError || !code || provider !== 'google' || !state || !safeEqual(state, returnedState)) {
    return redirectWithError(siteUrl, 'oauth-failed');
  }

  try {
    const identity = await fetchIdentity(provider, code, request);
    if (!identity.email) return redirectWithError(siteUrl, 'oauth-email-required');

    const result = await getPostgresPool().query(
      `INSERT INTO public.app_users (email, role, user_metadata, email_verified_at, must_reset_password)
       VALUES ($1, 'etudiant', $2::jsonb, NOW(), FALSE)
       ON CONFLICT (email) DO UPDATE
         SET user_metadata = public.app_users.user_metadata || EXCLUDED.user_metadata,
             email_verified_at = COALESCE(public.app_users.email_verified_at, NOW()),
             updated_at = NOW()
       RETURNING id, email, role, user_metadata`,
      [identity.email, JSON.stringify({ name: identity.name, full_name: identity.name, avatar_url: identity.picture })],
    );

    const response = NextResponse.redirect(new URL('/candidat?oauth=success', siteUrl));
    await createAuthSession(result.rows[0].id, response);
    response.cookies.set('inptic_oauth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/oauth/callback',
      maxAge: 0,
    });
    return response;
  } catch {
    return redirectWithError(siteUrl, 'oauth-failed');
  }
}

async function fetchIdentity(provider: string, code: string, request: NextRequest): Promise<OAuthIdentity> {
  const siteUrl = getAuthSiteUrl(request);
  const redirectUri = new URL('/api/auth/oauth/callback', siteUrl).toString();

  if (provider === 'google') {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error('Google OAuth credentials are not configured.');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      cache: 'no-store',
    });
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokenResponse.ok || !tokens.access_token) throw new Error('Google token exchange failed.');
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: 'no-store',
    });
    const profile = await profileResponse.json() as { email?: string; email_verified?: boolean; name?: string; picture?: string };
    if (!profileResponse.ok || !profile.email || !profile.email_verified) throw new Error('Google did not provide a verified email.');
    return { email: profile.email.trim().toLowerCase(), name: profile.name || '', picture: profile.picture || '' };
  }

  if (provider === 'facebook') {
    const clientId = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    if (!clientId || !clientSecret) throw new Error('Facebook OAuth credentials are not configured.');
    const tokenUrl = new URL('https://graph.facebook.com/v22.0/oauth/access_token');
    tokenUrl.search = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }).toString();
    const tokenResponse = await fetch(tokenUrl, { cache: 'no-store' });
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokenResponse.ok || !tokens.access_token) throw new Error('Facebook token exchange failed.');
    const profileUrl = new URL('https://graph.facebook.com/me?fields=id,name,email,picture.type(large)');
    const profileResponse = await fetch(profileUrl, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: 'no-store',
    });
    const profile = await profileResponse.json() as {
      email?: string;
      name?: string;
      picture?: { data?: { url?: string } };
    };
    if (!profileResponse.ok || !profile.email) throw new Error('Facebook did not provide an email address.');
    return {
      email: profile.email.trim().toLowerCase(),
      name: profile.name || '',
      picture: profile.picture?.data?.url || '',
    };
  }

  throw new Error('Unsupported OAuth provider.');
}

function safeEqual(first: string, second: string) {
  const a = Buffer.from(first);
  const b = Buffer.from(second);
  return a.length === b.length && timingSafeEqual(a, b);
}

function redirectWithError(siteUrl: string, code: string) {
  const url = new URL('/candidat', siteUrl);
  url.searchParams.set('authError', code);
  const response = NextResponse.redirect(url);
  response.cookies.set('inptic_oauth_state', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/oauth/callback',
    maxAge: 0,
  });
  return response;
}
