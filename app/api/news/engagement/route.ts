import { withSiteAudit } from '@/lib/site-audit';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';

const VISITOR_COOKIE = 'inptic_analytics_id';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIONS = ['view', 'like', 'share'] as const;
const NETWORK_COLUMNS = {
  whatsapp: ['shared_whatsapp', 'shares_whatsapp'],
  facebook: ['shared_facebook', 'shares_facebook'],
  linkedin: ['shared_linkedin', 'shares_linkedin'],
  youtube: ['shared_youtube', 'shares_youtube'],
  mail: ['shared_mail', 'shares_mail'],
  tiktok: ['shared_tiktok', 'shares_tiktok'],
} as const;
type EngagementAction = (typeof ACTIONS)[number];
type ShareNetwork = keyof typeof NETWORK_COLUMNS;

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Statistiques indisponibles.' }, { status: 503 });
  }

  try {
    const articleSlug = request.nextUrl.searchParams.get('articleSlug')?.trim();
    if (articleSlug !== undefined && articleSlug !== null) {
      if (!articleSlug || articleSlug.length > 200) {
        return NextResponse.json({ error: 'Article invalide.' }, { status: 400 });
      }
      const pool = getPostgresPool();
      const [counterResult, visitorResult] = await Promise.all([
        pool.query(
          `SELECT views_count, likes_count, shares_count
           FROM public.actualites_engagement_counters WHERE article_slug = $1`,
          [articleSlug],
        ),
        request.cookies.get(VISITOR_COOKIE)?.value && UUID_PATTERN.test(request.cookies.get(VISITOR_COOKIE)!.value)
          ? pool.query(
              `SELECT liked FROM public.actualites_engagement_visitors
               WHERE article_slug = $1 AND visitor_id = $2`,
              [articleSlug, request.cookies.get(VISITOR_COOKIE)!.value],
            )
          : Promise.resolve({ rows: [] }),
      ]);
      const counter = counterResult.rows[0];
      return NextResponse.json({
        data: {
          views: Number(counter?.views_count) || 0,
          likes: Number(counter?.likes_count) || 0,
          shares: Number(counter?.shares_count) || 0,
          liked: Boolean(visitorResult.rows[0]?.liked),
        },
      }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    const { rows } = await getPostgresPool().query(
      `SELECT article_slug, likes_count, shares_count,
              shares_whatsapp, shares_facebook, shares_linkedin,
              shares_youtube, shares_mail, shares_tiktok
       FROM public.actualites_engagement_counters
       WHERE article_slug LIKE 'tech-%'`,
    );
    const totals = rows.reduce((result, row) => ({
      likes: result.likes + Number(row.likes_count || 0),
      shares: result.shares + Number(row.shares_count || 0),
      shares_whatsapp: result.shares_whatsapp + Number(row.shares_whatsapp || 0),
      shares_facebook: result.shares_facebook + Number(row.shares_facebook || 0),
      shares_linkedin: result.shares_linkedin + Number(row.shares_linkedin || 0),
      shares_youtube: result.shares_youtube + Number(row.shares_youtube || 0),
      shares_mail: result.shares_mail + Number(row.shares_mail || 0),
      shares_tiktok: result.shares_tiktok + Number(row.shares_tiktok || 0),
    }), {
      likes: 0, shares: 0, shares_whatsapp: 0, shares_facebook: 0,
      shares_linkedin: 0, shares_youtube: 0, shares_mail: 0, shares_tiktok: 0,
    });
    const articles = rows.map((row) => ({
      articleSlug: String(row.article_slug),
      likes: Number(row.likes_count) || 0,
      shares: Number(row.shares_count) || 0,
      shares_whatsapp: Number(row.shares_whatsapp) || 0,
      shares_facebook: Number(row.shares_facebook) || 0,
      shares_linkedin: Number(row.shares_linkedin) || 0,
      shares_youtube: Number(row.shares_youtube) || 0,
      shares_mail: Number(row.shares_mail) || 0,
      shares_tiktok: Number(row.shares_tiktok) || 0,
    }));
    return NextResponse.json({ data: { ...totals, articles } });
  } catch (error) {
    console.error('Erreur de lecture des statistiques d’articles:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Statistiques indisponibles.' }, { status: 503 });
  }
}

async function siteAuditedPOST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const articleSlug = typeof body?.articleSlug === 'string' ? body.articleSlug.trim() : '';
  const action = body?.action as EngagementAction;
  const network = typeof body?.network === 'string' && body.network in NETWORK_COLUMNS
    ? body.network as ShareNetwork
    : null;

  if (!articleSlug || articleSlug.length > 200 || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Article ou interaction invalide.' }, { status: 400 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Le suivi des articles nécessite la configuration PostgreSQL.' }, { status: 503 });
  }

  const storedVisitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = storedVisitorId && UUID_PATTERN.test(storedVisitorId) ? storedVisitorId : randomUUID();
  const client = await getPostgresPool().connect();

  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO public.actualites_engagement_counters (article_slug)
       VALUES ($1) ON CONFLICT (article_slug) DO NOTHING`,
      [articleSlug],
    );
    await client.query(
      `INSERT INTO public.actualites_engagement_visitors (article_slug, visitor_id)
       VALUES ($1, $2) ON CONFLICT (article_slug, visitor_id) DO NOTHING`,
      [articleSlug, visitorId],
    );
    const { rows: visitorRows } = await client.query(
      `SELECT * FROM public.actualites_engagement_visitors
       WHERE article_slug = $1 AND visitor_id = $2 FOR UPDATE`,
      [articleSlug, visitorId],
    );
    const visitor = visitorRows[0];

    if (action === 'view') {
      const { rowCount } = await client.query(
        `UPDATE public.actualites_engagement_visitors
         SET last_viewed_on = CURRENT_DATE
         WHERE article_slug = $1 AND visitor_id = $2
           AND last_viewed_on IS DISTINCT FROM CURRENT_DATE
         RETURNING visitor_id`,
        [articleSlug, visitorId],
      );
      if (rowCount) {
        await client.query(
          `UPDATE public.actualites_engagement_counters SET views_count = views_count + 1
           WHERE article_slug = $1`,
          [articleSlug],
        );
      }
    } else if (action === 'like') {
      await client.query(
        `UPDATE public.actualites_engagement_visitors SET liked = NOT liked
         WHERE article_slug = $1 AND visitor_id = $2`,
        [articleSlug, visitorId],
      );
      await client.query(
        `UPDATE public.actualites_engagement_counters
         SET likes_count = GREATEST(0, likes_count + CASE WHEN $2 THEN -1 ELSE 1 END)
         WHERE article_slug = $1`,
        [articleSlug, visitor.liked],
      );
    } else if (network) {
      const [visitorColumn, counterColumn] = NETWORK_COLUMNS[network];
      if (!visitor[visitorColumn]) {
        await client.query(
          `UPDATE public.actualites_engagement_visitors
           SET ${visitorColumn} = TRUE, shared = TRUE
           WHERE article_slug = $1 AND visitor_id = $2`,
          [articleSlug, visitorId],
        );
        await client.query(
          `UPDATE public.actualites_engagement_counters
           SET shares_count = shares_count + 1, ${counterColumn} = ${counterColumn} + 1
           WHERE article_slug = $1`,
          [articleSlug],
        );
      }
    } else if (!visitor.shared) {
      await client.query(
        `UPDATE public.actualites_engagement_visitors SET shared = TRUE
         WHERE article_slug = $1 AND visitor_id = $2`,
        [articleSlug, visitorId],
      );
      await client.query(
        `UPDATE public.actualites_engagement_counters SET shares_count = shares_count + 1
         WHERE article_slug = $1`,
        [articleSlug],
      );
    }

    const { rows: counterRows } = await client.query(
      `SELECT views_count AS views, likes_count AS likes, shares_count AS shares,
              shares_whatsapp, shares_facebook, shares_linkedin, shares_youtube,
              shares_mail, shares_tiktok
       FROM public.actualites_engagement_counters WHERE article_slug = $1`,
      [articleSlug],
    );
    const { rows: currentVisitorRows } = await client.query(
      `SELECT liked FROM public.actualites_engagement_visitors
       WHERE article_slug = $1 AND visitor_id = $2`,
      [articleSlug, visitorId],
    );
    await client.query('COMMIT');

    const response = NextResponse.json({ data: { ...counterRows[0], liked: currentVisitorRows[0]?.liked ?? false } });
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
    return response;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur de mise à jour des statistiques d’articles:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Suivi indisponible. Vérifiez le schéma PostgreSQL.' }, { status: 503 });
  } finally {
    client.release();
  }
}

export const POST = withSiteAudit("Interaction avec une actualité", siteAuditedPOST);
