import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { createAuthSession, serializeAuthUser, verifyPassword } from '@/lib/postgres-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password || password.length > 256) {
    return NextResponse.json({ error: 'Adresse e-mail et mot de passe requis.' }, { status: 400 });
  }

  const result = await getPostgresPool().query(
    `SELECT id, email, role, user_metadata, password_hash, email_verified_at, must_reset_password
     FROM public.app_users WHERE email = $1 LIMIT 1`,
    [email],
  );
  const row = result.rows[0];
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return NextResponse.json({ error: 'Adresse e-mail ou mot de passe invalide.' }, { status: 401 });
  }
  if (!row.email_verified_at) {
    return NextResponse.json({ error: 'Confirmez votre adresse e-mail avant de vous connecter.' }, { status: 403 });
  }

  const response = NextResponse.json({
    user: serializeAuthUser(row),
    session: {
      access_token: 'cookie-session',
      token_type: 'bearer',
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    },
  });
  await createAuthSession(row.id, response);
  return response;
}
