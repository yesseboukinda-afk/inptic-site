import { createHash } from 'node:crypto';
import { getPostgresPool } from '@/lib/postgres';

type NewsletterPublication = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  targetPages: string[];
  attachments?: unknown[];
};

type NewsletterResult = {
  status: 'sent' | 'no_subscribers' | 'not_configured' | 'partial' | 'failed' | 'skipped';
  sent: number;
  failed: number;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPublicImageUrl(value: unknown, siteUrl: string) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim(), siteUrl);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function getPublicationImage(publication: NewsletterPublication, siteUrl: string) {
  const coverLine = publication.excerpt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^Image de couverture\s*:/i.test(line));
  const coverUrl = coverLine?.replace(/^Image de couverture\s*:\s*/i, '');
  const coverImage = getPublicImageUrl(coverUrl, siteUrl);
  if (coverImage) return coverImage;

  for (const attachment of publication.attachments || []) {
    if (!attachment || typeof attachment !== 'object') continue;
    const value = attachment as Record<string, unknown>;
    const url = typeof value.url === 'string' ? value.url : '';
    const type = typeof value.type === 'string' ? value.type : '';
    if (!type.startsWith('image/') && !/\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(url)) continue;
    const imageUrl = getPublicImageUrl(url, siteUrl);
    if (imageUrl) return imageUrl;
  }
  return null;
}

function getNewsletterSummary(excerpt: string) {
  const summaryLines = excerpt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^(?:Image de couverture|Source officielle)\s*:/i.test(line));
  const summary = summaryLines.join(' ').replace(/\s+/g, ' ').trim();
  const characters = Array.from(summary);
  if (characters.length <= 500) return summary;

  const shortened = characters.slice(0, 500).join('');
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > 350 ? lastSpace : 500).trimEnd()}…`;
}

function getEmailErrorCode(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const error = value as Record<string, unknown>;
  const code = error.name ?? error.code ?? error.statusCode;
  return typeof code === 'string' || typeof code === 'number' ? String(code).slice(0, 80) : null;
}

async function claimDelivery(publicationId: string, email: string): Promise<'claimed' | 'already_claimed' | 'failed'> {
  try {
    const { rows } = await getPostgresPool().query(
      `INSERT INTO public.newsletter_deliveries
         (publication_id, subscriber_email, status)
       VALUES ($1, $2, 'sending')
       ON CONFLICT (publication_id, subscriber_email) DO UPDATE
       SET status = 'sending', error_code = NULL, updated_at = NOW()
       WHERE public.newsletter_deliveries.status = 'failed'
       RETURNING publication_id`,
      [publicationId, email],
    );
    return rows.length ? 'claimed' : 'already_claimed';
  } catch (error) {
    console.error('Erreur de réservation d’un envoi newsletter:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return 'failed';
  }
}

async function dispatchPublicationNewsletter(
  publication: NewsletterPublication,
): Promise<NewsletterResult> {
  if (!publication.targetPages.includes('actualites')) {
    return { status: 'skipped', sent: 0, failed: 0 };
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;
  if (!resendKey || !from || !process.env.DATABASE_URL) {
    return { status: 'not_configured', sent: 0, failed: 0 };
  }

  let subscribers;
  try {
    const { rows } = await getPostgresPool().query(
      'SELECT email, unsubscribe_token FROM public.subscribers WHERE is_active = TRUE',
    );
    subscribers = rows;
  } catch (error) {
    console.error('Erreur de lecture des abonnés newsletter:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return { status: 'failed', sent: 0, failed: 0 };
  }
  if (!subscribers?.length) return { status: 'no_subscribers', sent: 0, failed: 0 };

  const siteUrl = (
    process.env.NEWSLETTER_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://inptic-ga.org'
  ).replace(/\/+$/, '');
  const articleUrl = `${siteUrl}/annonces#${encodeURIComponent(publication.slug)}`;
  const logoUrl = `${siteUrl}/logoinptic.png`;
  const articleImageUrl = getPublicationImage(publication, siteUrl);
  const safeTitle = escapeHtml(publication.title);
  const safeSummary = escapeHtml(getNewsletterSummary(publication.excerpt));
  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    const email = String(subscriber.email);
    const unsubscribeToken = String(subscriber.unsubscribe_token || '');
    if (!unsubscribeToken) {
      failed += 1;
      continue;
    }

    const claim = await claimDelivery(publication.id, email);
    if (claim === 'already_claimed') continue;
    if (claim === 'failed') {
      failed += 1;
      continue;
    }

    const idempotencyKey = createHash('sha256')
      .update(`inptic-newsletter/${publication.id}/${email}`)
      .digest('hex');
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: `Actualités INPTIC — ${publication.title}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#0f172a">
              <div style="margin:0 0 24px;text-align:center">
                <img src="${escapeHtml(logoUrl)}" alt="INPTIC Gabon" width="180" style="display:inline-block;width:180px;max-width:100%;height:auto">
              </div>
              <p style="font-size:12px;font-weight:bold;letter-spacing:.12em;color:#1d4ed8">ACTUALITÉS INPTIC GABON</p>
              <h1 style="font-size:24px;line-height:1.3">${safeTitle}</h1>
              ${articleImageUrl ? `<p style="margin:20px 0"><img src="${escapeHtml(articleImageUrl)}" alt="${safeTitle}" style="display:block;width:100%;height:auto;max-height:360px;object-fit:cover;border-radius:12px"></p>` : ''}
              <p style="font-size:16px;line-height:1.7">${safeSummary}</p>
              <p><a href="${escapeHtml(articleUrl)}" style="display:inline-block;padding:12px 18px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px">Lire l’actualité</a></p>
              <hr style="border:0;border-top:1px solid #e2e8f0;margin:32px 0 16px">
              <p style="font-size:12px;color:#64748b">Vous recevez ce message car vous êtes abonné à la newsletter de l’INPTIC.</p>
              <p style="font-size:12px"><a href="${escapeHtml(`${siteUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`)}">Se désabonner</a></p>
            </div>
          `,
        }),
        cache: 'no-store',
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || typeof result?.id !== 'string') {
        failed += 1;
        const errorCode = getEmailErrorCode(result);
        await getPostgresPool().query(
          `UPDATE public.newsletter_deliveries
           SET status = 'failed', error_code = $3, updated_at = NOW()
           WHERE publication_id = $1 AND subscriber_email = $2`,
          [publication.id, email, errorCode || `HTTP_${response.status}`],
        );
        continue;
      }

      try {
        await getPostgresPool().query(
          `UPDATE public.newsletter_deliveries
           SET status = 'sent', resend_email_id = $3, error_code = NULL, updated_at = NOW()
           WHERE publication_id = $1 AND subscriber_email = $2`,
          [publication.id, email, result.id],
        );
        sent += 1;
      } catch (error) {
        console.error('Erreur de confirmation d’un envoi newsletter:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
        failed += 1;
      }
    } catch (error) {
      failed += 1;
      const errorCode = error instanceof Error ? error.name : 'NETWORK_ERROR';
      console.error('Erreur réseau Resend pour la newsletter:', errorCode);
      await getPostgresPool().query(
        `UPDATE public.newsletter_deliveries
         SET status = 'failed', error_code = $3, updated_at = NOW()
         WHERE publication_id = $1 AND subscriber_email = $2`,
        [publication.id, email, errorCode],
      );
    }
  }

  return {
    status: failed > 0 ? (sent > 0 ? 'partial' : 'failed') : (sent > 0 ? 'sent' : 'skipped'),
    sent,
    failed,
  };
}

export async function sendPublicationNewsletter(
  publication: NewsletterPublication,
): Promise<NewsletterResult> {
  try {
    return await dispatchPublicationNewsletter(publication);
  } catch (error) {
    console.error(
      'Erreur inattendue pendant l’envoi automatique de la newsletter:',
      error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    );
    return { status: 'failed', sent: 0, failed: 0 };
  }
}
