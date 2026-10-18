import { withSiteAudit } from '@/lib/site-audit';
import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sendAuthEmail } from '@/lib/auth-email';
import { getPostgresPool } from '@/lib/postgres';
import { getAuthSiteUrl, hashOpaqueToken } from '@/lib/postgres-auth';
import { isSmtpEmailConfigured } from '@/lib/smtp-email';

export const runtime = 'nodejs';

async function siteAuditedPOST(request: NextRequest) {
  if (!isSmtpEmailConfigured()) {
    return NextResponse.json({ error: 'Le service de réinitialisation par e-mail n’est pas configuré.' }, { status: 503 });
  }
  const siteUrl = getAuthSiteUrl(request);

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  }

  const userResult = await getPostgresPool().query(
    'SELECT id FROM public.app_users WHERE email = $1 AND email_verified_at IS NOT NULL LIMIT 1',
    [email],
  );
  if (!userResult.rows[0]) {
    return NextResponse.json({ message: 'Si un compte vérifié existe avec cette adresse, un lien sera envoyé.' });
  }

  const token = randomBytes(32).toString('hex');
  await getPostgresPool().query(
    `UPDATE public.password_reset_tokens SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [userResult.rows[0].id],
  );
  await getPostgresPool().query(
    `INSERT INTO public.password_reset_tokens (token_hash, user_id, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
    [hashOpaqueToken(token), userResult.rows[0].id],
  );

  const resetUrl = new URL('/reset-password', siteUrl);
  resetUrl.searchParams.set('token', token);
  try {
    await sendAuthEmail(
      email,
      'Réinitialisez votre mot de passe INPTIC',
      `<p>Une demande de réinitialisation a été faite pour votre compte INPTIC.</p><p><a href="${resetUrl.toString()}">Choisir un nouveau mot de passe</a></p><p>Ce lien expire dans une heure. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.</p>`,
      `Une demande de réinitialisation a été faite pour votre compte INPTIC.\nLien de réinitialisation : ${resetUrl.toString()}\nCe lien expire dans une heure. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.`,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'L’envoi du courriel de réinitialisation a échoué.' },
      { status: 503 },
    );
  }

  return NextResponse.json({ message: 'Si un compte vérifié existe avec cette adresse, un lien sera envoyé.' });
}

export const POST = withSiteAudit("Demande de réinitialisation du mot de passe", siteAuditedPOST);
