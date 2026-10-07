import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSiteUrl } from '@/lib/postgres-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider');
  if (provider !== 'google' && provider !== 'facebook') {
    return NextResponse.json({ error: 'Fournisseur OAuth non pris en charge.' }, { status: 400 });
  }

  const clientId = provider === 'google' ? process.env.GOOGLE_CLIENT_ID : process.env.FACEBOOK_APP_ID;
  if (!clientId) {
    return NextResponse.json({ error: `La connexion ${provider} n’est pas configurée sur le serveur.` }, { status: 503 });
  }

  const state = randomBytes(32).toString('hex');
  const redirectUri = new URL('/api/auth/oauth/callback', getAuthSiteUrl(request));
  const authorizationUrl = provider === 'google'
    ? new URL('https://accounts.google.com/o/oauth2/v2/auth')
    : new URL('https://www.facebook.com/v22.0/dialog/oauth');
  authorizationUrl.searchParams.set('client_id', clientId);
  authorizationUrl.searchParams.set('redirect_uri', redirectUri.toString());
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('scope', provider === 'google' ? 'openid email profile' : 'email,public_profile');

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set('inptic_oauth_state', `${provider}:${state}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/oauth/callback',
    maxAge: 600,
  });
  return response;
}
