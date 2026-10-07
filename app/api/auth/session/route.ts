import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, serializeAuthUser } from '@/lib/postgres-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  return NextResponse.json({
    user: user ? serializeAuthUser(user) : null,
    session: user ? {
      access_token: 'cookie-session',
      token_type: 'bearer',
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      user: serializeAuthUser(user),
    } : null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
