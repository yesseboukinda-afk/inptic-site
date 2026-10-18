import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { createAuthSession, hashPassword, serializeAuthUser } from '@/lib/postgres-auth';

export const runtime = 'nodejs';

async function siteAuditedPOST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown; name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6 || password.length > 256 || !name) {
    return NextResponse.json({ error: 'Nom, adresse e-mail valide et mot de passe d’au moins 6 caractères requis.' }, { status: 400 });
  }

  const pool = getPostgresPool();
  const existing = await pool.query(
    'SELECT id, email_verified_at FROM public.app_users WHERE email = $1',
    [email],
  );
  if (existing.rows[0]?.email_verified_at) {
    return NextResponse.json({ error: 'Un compte existe déjà avec cette adresse e-mail.' }, { status: 409 });
  }
  const passwordHash = await hashPassword(password);
  const client = await pool.connect();
  const metadata = {
    name,
    full_name: name,
    role: 'etudiant',
    dossierValide: false,
    status: 'en_attente',
  };
  let result;
  try {
    await client.query('BEGIN');
    result = existing.rows[0]
      ? await client.query(
        `UPDATE public.app_users
         SET password_hash = $1, user_metadata = $2::jsonb, role = 'etudiant',
             email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW()
         WHERE id = $3
         RETURNING id, email, role, user_metadata`,
        [passwordHash, JSON.stringify(metadata), existing.rows[0].id],
      )
      : await client.query(
        `INSERT INTO public.app_users
           (email, password_hash, role, user_metadata, must_reset_password, email_verified_at)
         VALUES ($1, $2, 'etudiant', $3::jsonb, FALSE, NOW())
         RETURNING id, email, role, user_metadata`,
        [email, passwordHash, JSON.stringify(metadata)],
      );
    await client.query(
      `UPDATE public.email_verification_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [result.rows[0].id],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const user = serializeAuthUser(result.rows[0]);
  const response = NextResponse.json({
    user,
    session: {
      access_token: 'cookie-session',
      token_type: 'bearer',
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      user,
    },
    message: 'Compte créé et activé. Vous pouvez compléter votre dossier.',
  }, { status: 201 });
  await createAuthSession(result.rows[0].id, response);
  return response;
}

export const POST = withSiteAudit("Création de compte candidat", siteAuditedPOST);
