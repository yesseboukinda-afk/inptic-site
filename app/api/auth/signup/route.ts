import { withSiteAudit } from '@/lib/site-audit';
import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sendAuthEmail } from '@/lib/auth-email';
import { getPostgresPool } from '@/lib/postgres';
import { getAuthSiteUrl, hashOpaqueToken, hashPassword, serializeAuthUser } from '@/lib/postgres-auth';
import { isSmtpEmailConfigured } from '@/lib/smtp-email';

export const runtime = 'nodejs';

async function siteAuditedPOST(request: NextRequest) {
  if (!hasAuthMailConfig()) {
    return NextResponse.json({ error: 'Le service de confirmation e-mail n’est pas configuré.' }, { status: 503 });
  }
  const siteUrl = getAuthSiteUrl(request);

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
  const verificationToken = randomBytes(32).toString('hex');
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
         SET password_hash = $1, user_metadata = $2::jsonb, role = 'etudiant', updated_at = NOW()
         WHERE id = $3
         RETURNING id, email, role, user_metadata`,
        [passwordHash, JSON.stringify(metadata), existing.rows[0].id],
      )
      : await client.query(
        `INSERT INTO public.app_users (email, password_hash, role, user_metadata, must_reset_password)
         VALUES ($1, $2, 'etudiant', $3::jsonb, FALSE)
         RETURNING id, email, role, user_metadata`,
        [email, passwordHash, JSON.stringify(metadata)],
      );
    await client.query(
      `UPDATE public.email_verification_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [result.rows[0].id],
    );
    await client.query(
      `INSERT INTO public.email_verification_tokens (token_hash, user_id, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      [hashOpaqueToken(verificationToken), result.rows[0].id],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const verificationUrl = new URL('/api/auth/verify-email', siteUrl);
  verificationUrl.searchParams.set('token', verificationToken);
  try {
    await sendAuthEmail(
      email,
      'Confirmez votre adresse e-mail INPTIC',
      `<p>Bonjour ${escapeHtml(name)},</p><p>Confirmez votre adresse e-mail pour activer votre compte INPTIC.</p><p><a href="${verificationUrl.toString()}">Confirmer mon adresse e-mail</a></p><p>Ce lien expire dans 24 heures.</p>`,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'L’envoi du courriel de confirmation a échoué.' },
      { status: 503 },
    );
  }

  return NextResponse.json({
    user: serializeAuthUser(result.rows[0]),
    session: null,
    message: 'Compte créé. Consultez votre messagerie pour confirmer votre adresse e-mail.',
  }, { status: 201 });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

function hasAuthMailConfig() {
  return isSmtpEmailConfigured();
}

export const POST = withSiteAudit("Création de compte candidat", siteAuditedPOST);
