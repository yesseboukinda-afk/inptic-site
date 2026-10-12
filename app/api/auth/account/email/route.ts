import { withSiteAudit } from '@/lib/site-audit';
import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sendAuthEmail } from '@/lib/auth-email';
import { getPostgresPool } from '@/lib/postgres';
import { getAuthenticatedUser, getAuthSiteUrl, hashOpaqueToken, verifyPassword } from '@/lib/postgres-auth';
import { isSmtpEmailConfigured } from '@/lib/smtp-email';

export const runtime = 'nodejs';

async function siteAuditedPOST(request: NextRequest) {
  if (!isSmtpEmailConfigured()) {
    return NextResponse.json({ error: 'Le service de confirmation e-mail n’est pas configuré.' }, { status: 503 });
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Session requise. Reconnecte-toi pour modifier ton compte.' }, { status: 401 });
  }

  let body: { email?: unknown; currentPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  }
  if (!currentPassword || currentPassword.length > 256) {
    return NextResponse.json({ error: 'Saisis ton mot de passe actuel.' }, { status: 400 });
  }
  if (email === user.email.toLowerCase()) {
    return NextResponse.json({ error: 'Cette adresse est déjà celle de ton compte.' }, { status: 400 });
  }

  const siteUrl = getAuthSiteUrl(request);
  const client = await getPostgresPool().connect();
  const token = randomBytes(32).toString('hex');
  try {
    await client.query('BEGIN');
    const accountResult = await client.query(
      `SELECT email, password_hash, user_metadata
       FROM public.app_users WHERE id = $1 FOR UPDATE`,
      [user.id],
    );
    const account = accountResult.rows[0];
    if (!account || !(await verifyPassword(currentPassword, account.password_hash))) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Le mot de passe actuel est incorrect.' }, { status: 401 });
    }

    const existingAccount = await client.query(
      `SELECT 1 FROM public.app_users
       WHERE id <> $1 AND (email = $2 OR user_metadata->>'pending_email' = $2)
       LIMIT 1`,
      [user.id, email],
    );
    if (existingAccount.rowCount) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Cette adresse e-mail est déjà associée à un compte.' }, { status: 409 });
    }

    const profileConflict = await client.query(
      'SELECT 1 FROM public.profiles WHERE lower(email) = $1 AND lower(email) <> lower($2) LIMIT 1',
      [email, account.email],
    );
    if (profileConflict.rowCount) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Cette adresse est déjà associée à un dossier candidat.' }, { status: 409 });
    }

    await client.query(
      `UPDATE public.email_verification_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [user.id],
    );
    await client.query(
      `UPDATE public.app_users
       SET user_metadata = COALESCE(user_metadata, '{}'::jsonb) || jsonb_build_object('pending_email', $2::text),
           updated_at = NOW()
       WHERE id = $1`,
      [user.id, email],
    );
    await client.query(
      `INSERT INTO public.email_verification_tokens (token_hash, user_id, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      [hashOpaqueToken(token), user.id],
    );
    await client.query('COMMIT');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('[Account email change] PostgreSQL rollback error:', rollbackError instanceof Error ? rollbackError.message : 'UNKNOWN_ERROR');
    }
    console.error('[Account email change] PostgreSQL error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de préparer le changement d’adresse e-mail.' }, { status: 503 });
  } finally {
    client.release();
  }

  const verificationUrl = new URL('/api/auth/verify-email', siteUrl);
  verificationUrl.searchParams.set('token', token);
  try {
    await sendAuthEmail(
      email,
      'Confirmez votre nouvelle adresse e-mail INPTIC',
      `<p>Une demande de changement d’adresse e-mail a été faite pour votre compte INPTIC.</p><p><a href="${verificationUrl.toString()}">Confirmer cette adresse e-mail</a></p><p>Ce lien expire dans 24 heures. Votre adresse actuelle reste active jusqu’à la confirmation.</p>`,
    );
  } catch (error) {
    console.error('[Account email change] Email delivery error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Le changement est en attente, mais le courriel de confirmation n’a pas pu être envoyé. Réessaie plus tard.' }, { status: 503 });
  }

  return NextResponse.json({
    message: `Un lien de confirmation a été envoyé à ${email}. Ton adresse actuelle reste active jusqu’à la confirmation.`,
  });
}

export const POST = withSiteAudit("Demande de changement d’adresse e-mail", siteAuditedPOST);
