import { getPostgresPool } from '@/lib/postgres';
import { isSmtpEmailConfigured, sendSmtpEmail } from '@/lib/smtp-email';
import { RSS_SOURCES } from '@/lib/techVeilleSources';
import { fetchTechNewsFromSource, type TechNewsItem } from '@/lib/tech-veille';

const NEWSLETTER_TIME_ZONE = 'Africa/Libreville';
const DIGEST_REGIONS = ['Gabon', 'Afrique', 'Asie', 'Europe', 'Inde', 'International'] as const;
const GABON_TECH_NEWS_PATTERN = /tech(?:nology|nologie)?|num[eé]rique|digital|informatique|t[eé]l[eé]com|mobile|internet|web|cyber|intelligence artificielle|fintech|start[- ]?up|logiciel|application|donn[eé]es|data|e-commerce|paiement|wallet|portefeuille [eé]lectronique|r[eé]seau|5g|fibre optique/i;

type NewsletterPublication = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  targetPages: string[];
  attachments?: unknown[];
};

type NewsletterContest = {
  id: string;
  title: string;
  slug: string;
  department: string;
  sessionYear: number;
  description: string;
  conditions: string[];
  calendar: {
    registrationStart?: string | null;
    registrationEnd?: string | null;
    examDate?: string | null;
  };
};

type NewsletterResult = {
  status: 'sent' | 'no_subscribers' | 'not_configured' | 'partial' | 'failed' | 'skipped';
  sent: number;
  failed: number;
};

export type WeeklyDigestResult = {
  status: 'sent' | 'already_sent' | 'no_subscribers' | 'not_configured' | 'partial' | 'failed' | 'no_articles' | 'not_friday';
  sent: number;
  failed: number;
  articleCount: number;
  sourceFailures: number;
  weekOf: string;
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
  const code = error.code ?? error.responseCode ?? error.name;
  return typeof code === 'string' || typeof code === 'number' ? String(code).slice(0, 80) : null;
}

function isRelevantRegionalNews(item: TechNewsItem) {
  if (item.region !== 'Gabon' && item.region !== 'Afrique') return true;
  return GABON_TECH_NEWS_PATTERN.test(`${item.title} ${item.summary}`);
}

export async function claimDelivery(publicationId: string, email: string): Promise<'claimed' | 'already_claimed' | 'failed'> {
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

function getLibrevilleWeek(now: Date, completedWeek = false) {
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: NEWSLETTER_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => dateParts.find((item) => item.type === type)?.value || '';
  const year = Number(part('year'));
  const month = Number(part('month'));
  const day = Number(part('day'));
  const todayUtc = new Date(Date.UTC(year, month - 1, day));
  const daysSinceMonday = (todayUtc.getUTCDay() + 6) % 7;
  const mondayUtc = new Date(Date.UTC(year, month - 1, day - daysSinceMonday));
  const isFriday = new Intl.DateTimeFormat('en-US', {
    timeZone: NEWSLETTER_TIME_ZONE,
    weekday: 'short',
  }).format(now) === 'Fri';
  if (completedWeek && daysSinceMonday < 4) {
    mondayUtc.setUTCDate(mondayUtc.getUTCDate() - 7);
  }
  const weekOf = [
    mondayUtc.getUTCFullYear(),
    String(mondayUtc.getUTCMonth() + 1).padStart(2, '0'),
    String(mondayUtc.getUTCDate()).padStart(2, '0'),
  ].join('-');

  return {
    weekOf,
    start: new Date(mondayUtc.getTime() - 60 * 60 * 1000),
    end: completedWeek && !isFriday
      ? new Date(mondayUtc.getTime() + 4 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 - 1)
      : now,
    isFriday,
  };
}

function formatDigestItems(
  items: TechNewsItem[],
  siteUrl: string,
  weekOf: string,
  unsubscribeToken: string | null,
  previewOnly = false,
) {
  const grouped = new Map<string, TechNewsItem[]>();
  const seenUrls = new Set<string>();
  for (const item of items) {
    const region = item.region === 'Marques' ? 'International' : item.region;
    if (!DIGEST_REGIONS.includes(region as (typeof DIGEST_REGIONS)[number]) || seenUrls.has(item.url)) continue;
    seenUrls.add(item.url);
    const regionalItems = grouped.get(region) || [];
    if (regionalItems.length < 4) {
      regionalItems.push(item);
      grouped.set(region, regionalItems);
    }
  }

  const logoUrl = previewOnly ? '/logoinptic.ico' : `${siteUrl}/logoinptic.ico`;
  const unsubscribeUrl = unsubscribeToken
    ? `${siteUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
    : null;
  const textSections: string[] = [];
  const sections = DIGEST_REGIONS.flatMap((region) => {
    const regionalItems = grouped.get(region) || [];
    if (!regionalItems.length && region !== 'Gabon' && region !== 'Afrique') return [];

    textSections.push(region);
    const articles = regionalItems.map((item) => {
      const title = escapeHtml(item.title);
      const summary = escapeHtml(item.summary);
      const url = escapeHtml(item.url);
      const imageUrl = getPublicImageUrl(item.coverImage, siteUrl);
      const regionLabel = item.region === 'Marques' ? 'International' : item.region;
      textSections.push(`${item.title}\n${item.summary}\n${item.source} · ${item.url}`);
      return { item: { ...item, region: regionLabel }, title, summary, url, imageUrl };
    });
    return [{ region, articles }];
  });

  const lead = sections.find(({ articles }) => articles.length > 0)?.articles[0];
  const leadImage = lead?.imageUrl
    ? `<img src="${escapeHtml(lead.imageUrl)}" alt="${lead.title}" width="640" style="display:block;width:100%;height:auto;max-height:360px;object-fit:cover">`
    : '';
  const leadArticle = lead ? `
    <section style="margin:28px 0 34px;background:#10233f;color:#fff">
      ${leadImage}
      <div style="padding:24px 26px 28px">
        <p style="margin:0 0 12px;color:#9fbfff;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">À LA UNE&nbsp; · &nbsp;${escapeHtml(lead.item.region)}</p>
        <p style="margin:0 0 10px;color:#cbd5e1;font-size:12px">${escapeHtml(lead.item.source)} &nbsp;|&nbsp; ${escapeHtml(lead.item.date)}</p>
        <h2 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;font-weight:normal">
          <a href="${lead.url}" style="color:#fff;text-decoration:none">${lead.title}</a>
        </h2>
        <p style="margin:0 0 20px;color:#e2e8f0;font-size:15px;line-height:1.75">${lead.summary}</p>
        <a href="${lead.url}" style="display:inline-block;padding:11px 16px;background:#f0b35a;color:#10233f;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:.5px">LIRE L’ARTICLE&nbsp; →</a>
      </div>
    </section>` : '';
  const contents = sections.length
    ? `<p style="margin:0;padding:16px 0;border-top:1px solid #dbe2eb;border-bottom:1px solid #dbe2eb;color:#526176;font-size:12px;line-height:2">
        <strong style="color:#10233f;letter-spacing:1px">DANS CE NUMÉRO&nbsp; / &nbsp;</strong>
        ${sections.map(({ region }, index) => `<a href="#region-${index + 1}" style="color:#1d4ed8;text-decoration:none">${escapeHtml(region)}</a>`).join('&nbsp;&nbsp;·&nbsp;&nbsp;')}
      </p>`
    : '';
  const htmlSections = sections.map(({ region, articles }, sectionIndex) => {
    const sectionArticles = articles.filter((article) => article.url !== lead?.url);
    const cards = sectionArticles.map(({ item, title, summary, url, imageUrl }) => `
      <article style="padding:20px 0;border-bottom:1px solid #dbe2eb">
        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${title}" width="600" style="display:block;width:100%;height:auto;max-height:230px;object-fit:cover;margin:0 0 14px">` : ''}
        <p style="margin:0 0 8px;color:#718096;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase">${escapeHtml(item.source)} &nbsp;·&nbsp; ${escapeHtml(item.date)}</p>
        <h3 style="margin:0 0 9px;font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1.32;font-weight:normal"><a href="${url}" style="color:#10233f;text-decoration:none">${title}</a></h3>
        <p style="margin:0 0 12px;color:#435168;font-size:14px;line-height:1.75">${summary}</p>
        <a href="${url}" style="color:#1d4ed8;font-size:11px;font-weight:bold;letter-spacing:.6px;text-decoration:none">LIRE LA SOURCE&nbsp; →</a>
      </article>`).join('');
    return `
      <section id="region-${sectionIndex + 1}" style="margin:36px 0">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:4px">
          <tr>
            <td style="width:48px;color:#f0b35a;font-family:Georgia,'Times New Roman',serif;font-size:24px;vertical-align:middle">0${sectionIndex + 1}</td>
            <td style="border-bottom:2px solid #10233f;padding:0 0 10px;vertical-align:middle">
              <h2 style="margin:0;color:#10233f;font-family:Georgia,'Times New Roman',serif;font-size:25px;font-weight:normal">${escapeHtml(region)}</h2>
            </td>
            <td style="border-bottom:2px solid #10233f;padding:0 0 10px;text-align:right;color:#718096;font-size:11px;vertical-align:middle">${articles.length} SUJET${articles.length > 1 ? 'S' : ''}</td>
          </tr>
        </table>
        ${cards || `<p style="padding:16px 0;color:#718096;font-size:13px;font-style:italic">${region === 'Gabon' ? 'Aucune actualité technologique gabonaise n’a été repérée dans les flux cette semaine.' : 'Aucune actualité technologique africaine supplémentaire n’a été repérée dans les flux cette semaine.'}</p>`}
      </section>`;
  }).join('');

  const displayDate = escapeHtml(weekOf);
  const html = `
    <div style="max-width:720px;margin:0 auto;background:#fff;color:#10233f;font-family:Arial,Helvetica,sans-serif">
      <div style="height:7px;background:#f0b35a"></div>
      <header style="padding:25px 30px 18px;text-align:center">
        <img src="${escapeHtml(logoUrl)}" alt="INPTIC Gabon" width="155" style="display:block;width:155px;max-width:100%;height:auto;margin:0 auto 18px">
        <p style="margin:0;color:#10233f;font-size:11px;font-weight:bold;letter-spacing:3px">INPTIC &nbsp; / &nbsp; LE MAGAZINE</p>
      </header>
      <div style="margin:0 30px;border-top:1px solid #dbe2eb;border-bottom:1px solid #dbe2eb;padding:10px 0;text-align:center;color:#526176;font-size:10px;font-weight:bold;letter-spacing:1.5px">
        TECHNOLOGIE &nbsp;&nbsp;·&nbsp;&nbsp; INNOVATION &nbsp;&nbsp;·&nbsp;&nbsp; MONDE
      </div>
      <main style="padding:28px 30px 12px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:20px">
          <tr>
            <td style="color:#1d4ed8;font-size:11px;font-weight:bold;letter-spacing:1.5px">ÉDITION HEBDOMADAIRE</td>
            <td style="text-align:right;color:#718096;font-size:11px">${displayDate}</td>
          </tr>
        </table>
        <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1.12;font-weight:normal;letter-spacing:-.7px">Le monde numérique,<br>en perspective.</h1>
        <p style="margin:0 0 26px;color:#526176;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65">Le Gabon et l’Afrique d’abord. Puis les idées et les innovations qui font bouger le monde.</p>
        ${!unsubscribeToken && !previewOnly ? '<p style="padding:10px;background:#fef3c7;color:#92400e;font-weight:bold">E-mail de test — aucun abonné ne reçoit cet envoi.</p>' : ''}
        ${leadArticle}
        ${contents}
        ${htmlSections}
      </main>
      <footer style="margin-top:34px;padding:23px 30px;background:#10233f;color:#cbd5e1">
        <p style="margin:0 0 8px;color:#fff;font-family:Georgia,'Times New Roman',serif;font-size:17px">INPTIC &nbsp; / &nbsp; Le magazine</p>
        <p style="margin:0 0 12px;font-size:11px;line-height:1.7">Votre rendez-vous hebdomadaire avec l’actualité technologique internationale.</p>
        ${unsubscribeToken ? '<p style="margin:0 0 10px;font-size:11px">Vous recevez cette revue car vous êtes abonné à la newsletter de l’INPTIC.</p>' : ''}
        ${unsubscribeUrl ? `<p style="margin:0;font-size:11px"><a href="${escapeHtml(unsubscribeUrl)}" style="color:#f0b35a">Gérer mon abonnement</a></p>` : ''}
      </footer>
    </div>`;

  const text = [
    'INPTIC GABON — REVUE HEBDOMADAIRE IT',
    `Semaine du ${weekOf}`,
    'Sélection d’actualités du lundi au vendredi, classées par région.',
    ...(!unsubscribeToken && !previewOnly ? ['E-mail de test — aucun abonné ne reçoit cet envoi.'] : []),
    ...(unsubscribeToken ? ['Vous recevez cette revue car vous êtes abonné à la newsletter de l’INPTIC.'] : []),
    '',
    ...textSections,
    '',
    ...(unsubscribeUrl ? [`Se désabonner : ${unsubscribeUrl}`] : []),
  ].join('\n');

  return { html, text };
}

export async function previewWeeklyTechDigest(now = new Date()) {
  const week = getLibrevilleWeek(now, true);
  const sourceResults = await Promise.all(
    RSS_SOURCES.map((source) => fetchTechNewsFromSource(source)),
  );
  const sourceFailures = sourceResults.filter((result) => result.errorCode !== null).length;
  sourceResults.forEach((result, index) => {
    if (result.errorCode) {
      console.error(`Flux RSS indisponible pour l’aperçu de la revue (${RSS_SOURCES[index].name}):`, result.errorCode);
    }
  });

  const articles = sourceResults
    .flatMap((result) => result.items)
    .filter(isRelevantRegionalNews)
    .filter((item) => item.timestamp >= week.start.getTime() && item.timestamp <= week.end.getTime())
    .sort((first, second) => second.timestamp - first.timestamp);
  const seenUrls = new Set<string>();
  const uniqueArticles = articles.filter((item) => {
    if (seenUrls.has(item.url)) return false;
    seenUrls.add(item.url);
    return true;
  });
  const siteUrl = (
    process.env.NEWSLETTER_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://inptic-ga.org'
  ).replace(/\/+$/, '');
  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: NEWSLETTER_TIME_ZONE,
    dateStyle: 'long',
  });
  const { html, text } = formatDigestItems(
    uniqueArticles,
    siteUrl,
    dateFormatter.format(week.start),
    null,
    true,
  );
  return {
    html,
    text,
    articleCount: DIGEST_REGIONS.reduce((count, region) => count + uniqueArticles.filter((item) =>
      (item.region === 'Marques' ? 'International' : item.region) === region,
    ).slice(0, 4).length, 0),
    sourceFailures,
    weekOf: week.weekOf,
  };
}

export async function sendWeeklyTechDigest(now = new Date()): Promise<WeeklyDigestResult> {
  const week = getLibrevilleWeek(now);
  const emptyResult = {
    sent: 0,
    failed: 0,
    articleCount: 0,
    sourceFailures: 0,
    weekOf: week.weekOf,
  };
  if (!week.isFriday) return { ...emptyResult, status: 'not_friday' };
  if (!isSmtpEmailConfigured() || !process.env.DATABASE_URL) {
    return { ...emptyResult, status: 'not_configured' };
  }

  let subscribers;
  try {
    const { rows } = await getPostgresPool().query(
      'SELECT email, unsubscribe_token FROM public.subscribers WHERE is_active = TRUE AND is_blocked = FALSE',
    );
    subscribers = rows;
  } catch (error) {
    console.error('Erreur de lecture des abonnés pour la revue hebdomadaire:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return { ...emptyResult, status: 'failed' };
  }
  if (!subscribers.length) return { ...emptyResult, status: 'no_subscribers' };

  const sourceResults = await Promise.all(
    RSS_SOURCES.map((source) => fetchTechNewsFromSource(source, true)),
  );
  const sourceFailures = sourceResults.filter((result) => result.errorCode !== null).length;
  sourceResults.forEach((result, index) => {
    if (result.errorCode) {
      console.error(`Flux RSS indisponible pour la revue (${RSS_SOURCES[index].name}):`, result.errorCode);
    }
  });
  const weekArticles = sourceResults
    .flatMap((result) => result.items)
    .filter(isRelevantRegionalNews)
    .filter((item) => item.timestamp >= week.start.getTime() && item.timestamp <= week.end.getTime())
    .sort((first, second) => second.timestamp - first.timestamp);
  const seenUrls = new Set<string>();
  const articles = weekArticles.filter((item) => {
    if (seenUrls.has(item.url)) return false;
    seenUrls.add(item.url);
    return true;
  });
  const articleCount = DIGEST_REGIONS.reduce((count, region) => count + articles.filter((item) =>
    (item.region === 'Marques' ? 'International' : item.region) === region,
  ).slice(0, 4).length, 0);
  if (!articleCount) {
    return {
      ...emptyResult,
      sourceFailures,
      status: sourceFailures === RSS_SOURCES.length ? 'failed' : 'no_articles',
    };
  }

  const siteUrl = (
    process.env.NEWSLETTER_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://inptic-site.vercel.app'
  ).replace(/\/+$/, '');
  const weekArticlesForEmail = articles.filter((item) => {
    const region = item.region === 'Marques' ? 'International' : item.region;
    return DIGEST_REGIONS.includes(region as (typeof DIGEST_REGIONS)[number]);
  });
  const publicationId = `weekly-digest-${week.weekOf}`;
  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: NEWSLETTER_TIME_ZONE,
    dateStyle: 'long',
  });
  const subject = `Revue IT internationale — semaine du ${dateFormatter.format(week.start)}`;
  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    const email = String(subscriber.email);
    const unsubscribeToken = subscriber.unsubscribe_token;
    if (!unsubscribeToken) {
      failed += 1;
      continue;
    }

    const claim = await claimDelivery(publicationId, email);
    if (claim === 'already_claimed') continue;
    if (claim === 'failed') {
      failed += 1;
      continue;
    }

    try {
      const { html, text } = formatDigestItems(weekArticlesForEmail, siteUrl, dateFormatter.format(week.start), unsubscribeToken);
      const result = await sendSmtpEmail({
        to: email,
        subject,
        html,
        text,
      });
      await getPostgresPool().query(
        `UPDATE public.newsletter_deliveries
         SET status = 'sent', resend_email_id = $2, error_code = NULL, updated_at = NOW()
         WHERE publication_id = $1 AND subscriber_email = $3`,
        [publicationId, result.messageId, email],
      );
      sent += 1;
    } catch (error) {
      failed += 1;
      const errorCode = getEmailErrorCode(error) || 'SMTP_ERROR';
      console.error('Erreur d’envoi de la revue hebdomadaire:', errorCode);
      try {
        await getPostgresPool().query(
          `UPDATE public.newsletter_deliveries
           SET status = 'failed', error_code = $3, updated_at = NOW()
           WHERE publication_id = $1 AND subscriber_email = $2`,
          [publicationId, email, errorCode],
        );
      } catch (updateError) {
        console.error('Erreur de sauvegarde de l’échec de la revue:', updateError instanceof Error ? updateError.message : 'UNKNOWN_ERROR');
      }
    }
  }

  return {
    status: failed > 0 || sourceFailures > 0
      ? (sent > 0 ? 'partial' : 'failed')
      : (sent > 0 ? 'sent' : 'already_sent'),
    sent,
    failed,
    articleCount,
    sourceFailures,
    weekOf: week.weekOf,
  };
}

async function dispatchPublicationNewsletter(
  publication: NewsletterPublication,
): Promise<NewsletterResult> {
  if (!publication.targetPages.includes('actualites')) {
    return { status: 'skipped', sent: 0, failed: 0 };
  }

  if (!isSmtpEmailConfigured() || !process.env.DATABASE_URL) {
    return { status: 'not_configured', sent: 0, failed: 0 };
  }

  let subscribers;
  try {
    const { rows } = await getPostgresPool().query(
      'SELECT email, unsubscribe_token FROM public.subscribers WHERE is_active = TRUE AND is_blocked = FALSE',
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
    'https://inptic-site.vercel.app'
  ).replace(/\/+$/, '');
  const articleUrl = `${siteUrl}/annonces#${encodeURIComponent(publication.slug)}`;
  const logoUrl = `${siteUrl}/logoinptic.ico`;
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

    try {
      const result = await sendSmtpEmail({
        to: email,
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
      });
      try {
        await getPostgresPool().query(
          `UPDATE public.newsletter_deliveries
           SET status = 'sent', resend_email_id = $3, error_code = NULL, updated_at = NOW()
           WHERE publication_id = $1 AND subscriber_email = $2`,
          [publication.id, email, result.messageId],
        );
        sent += 1;
      } catch (error) {
        console.error('Erreur de confirmation d’un envoi newsletter:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
        failed += 1;
      }
    } catch (error) {
      failed += 1;
      const errorCode = getEmailErrorCode(error) || 'SMTP_ERROR';
      console.error('Erreur SMTP pour la newsletter:', errorCode);
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

async function dispatchContestNewsletter(contest: NewsletterContest): Promise<NewsletterResult> {
  if (!isSmtpEmailConfigured() || !process.env.DATABASE_URL) {
    return { status: 'not_configured', sent: 0, failed: 0 };
  }

  let subscribers;
  try {
    const { rows } = await getPostgresPool().query(
      'SELECT email, unsubscribe_token FROM public.subscribers WHERE is_active = TRUE AND is_blocked = FALSE',
    );
    subscribers = rows;
  } catch (error) {
    console.error('Erreur de lecture des abonnés newsletter pour le concours:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return { status: 'failed', sent: 0, failed: 0 };
  }
  if (!subscribers?.length) return { status: 'no_subscribers', sent: 0, failed: 0 };

  const siteUrl = (
    process.env.NEWSLETTER_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://inptic-ga.org.tld'
  ).replace(/\/+$/, '');
  const contestUrl = `${siteUrl}/concours`;
  const unsubscribeBaseUrl = `${siteUrl}/api/newsletter/unsubscribe`;
  const safeTitle = escapeHtml(contest.title);
  const safeDepartment = escapeHtml(contest.department);
  const safeDescription = escapeHtml(contest.description);
  const safeConditions = contest.conditions.map((condition) => escapeHtml(condition));
  const formatDate = (value?: string | null) => {
    if (!value) return 'À préciser';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return 'À préciser';
    return new Intl.DateTimeFormat('fr-GA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Africa/Libreville',
    }).format(date);
  };
  const registrationStart = formatDate(contest.calendar.registrationStart);
  const registrationEnd = formatDate(contest.calendar.registrationEnd);
  const examDate = formatDate(contest.calendar.examDate);
  const conditionsHtml = safeConditions.length
    ? `<ul>${safeConditions.map((condition) => `<li>${condition}</li>`).join('')}</ul>`
    : '';
  const conditionsText = contest.conditions.length
    ? `\nConditions :\n${contest.conditions.map((condition) => `- ${condition}`).join('\n')}`
    : '';
  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    const email = String(subscriber.email);
    const unsubscribeToken = String(subscriber.unsubscribe_token || '');
    if (!unsubscribeToken) {
      failed += 1;
      continue;
    }

    const publicationId = `concours-${contest.id}`;
    const claim = await claimDelivery(publicationId, email);
    if (claim === 'already_claimed') continue;
    if (claim === 'failed') {
      failed += 1;
      continue;
    }

    try {
      const unsubscribeUrl = `${unsubscribeBaseUrl}?token=${encodeURIComponent(unsubscribeToken)}`;
      const result = await sendSmtpEmail({
        to: email,
        subject: `Concours INPTIC ${contest.sessionYear} — ${contest.title}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#0f172a">
            <div style="margin:0 0 24px;text-align:center">
              <img src="${escapeHtml(`${siteUrl}/logoinptic.ico`)}" alt="INPTIC Gabon" width="180" style="display:inline-block;width:180px;max-width:100%;height:auto">
            </div>
            <p style="font-size:12px;font-weight:bold;letter-spacing:.12em;color:#1d4ed8">NOUVEAU CONCOURS INPTIC</p>
            <h1 style="font-size:24px;line-height:1.3">${safeTitle}</h1>
            <p style="font-size:14px;color:#475569"><strong>Session :</strong> ${contest.sessionYear}<br><strong>Filières / département :</strong> ${safeDepartment}</p>
            <p style="font-size:15px;line-height:1.7">${safeDescription}</p>
            <div style="margin:20px 0;padding:16px;border-radius:10px;background:#f1f5f9;font-size:14px;line-height:1.8">
              <strong>Ouverture des inscriptions :</strong> ${escapeHtml(registrationStart)}<br>
              <strong>Clôture des inscriptions :</strong> ${escapeHtml(registrationEnd)}<br>
              <strong>Date du concours :</strong> ${escapeHtml(examDate)}
            </div>
            ${conditionsHtml ? `<h2 style="font-size:17px">Conditions de candidature</h2>${conditionsHtml}` : ''}
            <p><a href="${escapeHtml(contestUrl)}" style="display:inline-block;padding:12px 18px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px">Consulter le concours</a></p>
            <hr style="border:0;border-top:1px solid #e2e8f0;margin:32px 0 16px">
            <p style="font-size:12px;color:#64748b">Vous recevez ce message car vous êtes abonné à la newsletter de l’INPTIC.</p>
            <p style="font-size:12px"><a href="${escapeHtml(unsubscribeUrl)}">Se désabonner</a></p>
          </div>`,
        text: [
          `NOUVEAU CONCOURS INPTIC — Session ${contest.sessionYear}`,
          contest.title,
          `Filières / département : ${contest.department}`,
          '',
          contest.description,
          '',
          `Ouverture des inscriptions : ${registrationStart}`,
          `Clôture des inscriptions : ${registrationEnd}`,
          `Date du concours : ${examDate}`,
          conditionsText,
          '',
          `Consulter le concours : ${contestUrl}`,
          '',
          `Se désabonner : ${unsubscribeUrl}`,
        ].join('\n'),
      });
      await getPostgresPool().query(
        `UPDATE public.newsletter_deliveries
         SET status = 'sent', resend_email_id = $3, error_code = NULL, updated_at = NOW()
         WHERE publication_id = $1 AND subscriber_email = $2`,
        [publicationId, email, result.messageId],
      );
      sent += 1;
    } catch (error) {
      failed += 1;
      const errorCode = getEmailErrorCode(error) || 'SMTP_ERROR';
      console.error('Erreur d’envoi de la newsletter concours:', errorCode);
      try {
        await getPostgresPool().query(
          `UPDATE public.newsletter_deliveries
           SET status = 'failed', error_code = $3, updated_at = NOW()
           WHERE publication_id = $1 AND subscriber_email = $2`,
          [publicationId, email, errorCode],
        );
      } catch (updateError) {
        console.error('Erreur de sauvegarde de l’échec de la newsletter concours:', updateError instanceof Error ? updateError.message : 'UNKNOWN_ERROR');
      }
    }
  }

  return {
    status: failed > 0 ? (sent > 0 ? 'partial' : 'failed') : (sent > 0 ? 'sent' : 'skipped'),
    sent,
    failed,
  };
}

export async function sendContestNewsletter(contest: NewsletterContest): Promise<NewsletterResult> {
  try {
    return await dispatchContestNewsletter(contest);
  } catch (error) {
    console.error(
      'Erreur inattendue pendant l’envoi de la newsletter concours:',
      error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    );
    return { status: 'failed', sent: 0, failed: 0 };
  }
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
