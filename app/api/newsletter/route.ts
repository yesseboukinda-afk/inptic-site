import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const email = 'email' in body && typeof body.email === 'string'
    ? body.email.trim().toLowerCase()
    : '';

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Le service d’inscription à la newsletter est indisponible.' },
      { status: 503 },
    );
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;
  if (!resendKey || !from) {
    return NextResponse.json(
      { error: 'L’envoi du courriel de confirmation n’est pas configuré. Veuillez réessayer plus tard.' },
      { status: 503 },
    );
  }

  let existingSubscriber;
  try {
    const { rows } = await getPostgresPool().query(
      `SELECT is_active, subscribed_at, confirmation_sent_at
       FROM public.subscribers WHERE email = $1`,
      [email],
    );
    existingSubscriber = rows[0];
  } catch (error) {
    console.error('Erreur de vérification d’une inscription newsletter:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json(
      { error: 'Impossible de vérifier votre inscription pour le moment. Veuillez réessayer plus tard.' },
      { status: 503 },
    );
  }

  if (existingSubscriber?.is_active && existingSubscriber.confirmation_sent_at) {
    return NextResponse.json({
      success: true,
      message: 'Cette adresse est déjà inscrite à la newsletter.',
    });
  }

  const subscribedAt = existingSubscriber?.is_active
    ? existingSubscriber.subscribed_at
    : new Date().toISOString();
  try {
    await getPostgresPool().query(
      `INSERT INTO public.subscribers (email, subscribed_at, is_active, confirmation_sent_at)
       VALUES ($1, $2, TRUE, NULL)
       ON CONFLICT (email) DO UPDATE
       SET subscribed_at = EXCLUDED.subscribed_at,
           is_active = TRUE,
           confirmation_sent_at = NULL`,
      [email, subscribedAt],
    );
  } catch (error) {
    console.error('Erreur d’enregistrement d’une inscription newsletter:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json(
      { error: 'Impossible d’enregistrer votre inscription pour le moment. Veuillez réessayer plus tard.' },
      { status: 503 },
    );
  }

  const siteUrl = (
    process.env.NEWSLETTER_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://inptic-site.vercel.app'
  ).replace(/\/+$/, '');
  const idempotencyKey = createHash('sha256')
    .update(`inptic-newsletter-confirmation/${email}/${subscribedAt}`)
    .digest('hex');

  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Confirmation de votre inscription à la newsletter INPTIC',
        text: `Bonjour,\n\nVotre adresse e-mail est bien inscrite à la newsletter de l’INPTIC Gabon. Vous recevrez les prochaines actualités publiées sur ${siteUrl}.\n\nSi vous n’êtes pas à l’origine de cette inscription, vous pouvez ignorer ce message.`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a">
            <div style="margin:0 0 24px;text-align:center">
              <img src="${escapeHtml(`${siteUrl}/logoinptic.png`)}" alt="INPTIC Gabon" width="180" style="display:inline-block;width:180px;max-width:100%;height:auto">
            </div>
            <p style="font-size:12px;font-weight:bold;letter-spacing:.12em;color:#1d4ed8">NEWSLETTER INPTIC GABON</p>
            <h1 style="font-size:24px;line-height:1.3">Inscription confirmée</h1>
            <p style="font-size:16px;line-height:1.7">Votre adresse e-mail est bien inscrite à la newsletter de l’INPTIC Gabon. Vous recevrez les prochaines actualités publiées sur le site.</p>
            <p><a href="${escapeHtml(siteUrl)}" style="display:inline-block;padding:12px 18px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px">Visiter le site de l’INPTIC</a></p>
            <p style="font-size:12px;color:#64748b">Si vous n’êtes pas à l’origine de cette inscription, vous pouvez ignorer ce message.</p>
          </div>
        `,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error(
      'Échec réseau de l’envoi de confirmation newsletter:',
      error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    );
    return NextResponse.json(
      { error: 'Votre inscription est enregistrée, mais le courriel de confirmation n’a pas pu être envoyé. Veuillez réessayer.' },
      { status: 502 },
    );
  }

  const result: unknown = await response.json().catch(() => null);
  const resendResult = result && typeof result === 'object'
    ? result as Record<string, unknown>
    : null;
  if (!response.ok || typeof resendResult?.id !== 'string') {
    const errorCode = typeof resendResult?.name === 'string'
      ? resendResult.name
      : `HTTP_${response.status}`;
    console.error('Échec Resend pour le courriel de confirmation newsletter:', errorCode);
    return NextResponse.json(
      { error: 'Votre inscription est enregistrée, mais le courriel de confirmation n’a pas pu être envoyé. Veuillez vérifier la configuration d’envoi et réessayer.' },
      { status: 502 },
    );
  }

  try {
    await getPostgresPool().query(
      'UPDATE public.subscribers SET confirmation_sent_at = $1 WHERE email = $2',
      [new Date().toISOString(), email],
    );
  } catch (error) {
    console.error('Erreur de sauvegarde de la confirmation newsletter:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
  }

  return NextResponse.json({
    success: true,
    message: 'Inscription confirmée ! Un courriel de confirmation vient de vous être envoyé.',
  });
}
