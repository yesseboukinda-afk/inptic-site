import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const VISITOR_COOKIE = 'inptic_analytics_id';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIONS = ['view', 'like', 'share'] as const;
const NETWORKS = ['whatsapp', 'facebook', 'linkedin', 'youtube', 'mail', 'tiktok'] as const;
type EngagementAction = (typeof ACTIONS)[number];
type ShareNetwork = (typeof NETWORKS)[number];

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Statistiques indisponibles.' }, { status: 503 });
  }

  const requestedArticleSlug = request.nextUrl.searchParams.get('articleSlug');
  if (requestedArticleSlug !== null) {
    const articleSlug = requestedArticleSlug.trim();
    if (!articleSlug || articleSlug.length > 200) {
      return NextResponse.json({ error: 'Article invalide.' }, { status: 400 });
    }

    const { data: counter, error: counterError } = await supabaseAdmin
      .from('actualites_engagement_counters')
      .select('likes_count, shares_count')
      .eq('article_slug', articleSlug)
      .maybeSingle();

    if (counterError) return NextResponse.json({ error: 'Statistiques indisponibles.' }, { status: 503 });

    const storedVisitorId = request.cookies.get(VISITOR_COOKIE)?.value;
    let liked = false;
    if (storedVisitorId && UUID_PATTERN.test(storedVisitorId)) {
      const { data: visitor, error: visitorError } = await supabaseAdmin
        .from('actualites_engagement_visitors')
        .select('liked')
        .eq('article_slug', articleSlug)
        .eq('visitor_id', storedVisitorId)
        .maybeSingle();

      if (visitorError) return NextResponse.json({ error: 'Statistiques indisponibles.' }, { status: 503 });
      liked = Boolean(visitor?.liked);
    }

    return NextResponse.json({
      data: {
        likes: Number(counter?.likes_count) || 0,
        shares: Number(counter?.shares_count) || 0,
        liked,
      },
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  }

  const { data, error } = await supabaseAdmin
    .from('actualites_engagement_counters')
    .select('article_slug, likes_count, shares_count, shares_whatsapp, shares_facebook, shares_linkedin, shares_youtube, shares_mail, shares_tiktok')
    .like('article_slug', 'tech-%');

  if (error) return NextResponse.json({ error: 'Statistiques indisponibles.' }, { status: 503 });

  const rows = data || [];

  const totals = rows.reduce((result, row) => ({
    likes:            result.likes            + (Number(row.likes_count)      || 0),
    shares:           result.shares           + (Number(row.shares_count)     || 0),
    shares_whatsapp:  result.shares_whatsapp  + (Number(row.shares_whatsapp)  || 0),
    shares_facebook:  result.shares_facebook  + (Number(row.shares_facebook)  || 0),
    shares_linkedin:  result.shares_linkedin  + (Number(row.shares_linkedin)  || 0),
    shares_youtube:   result.shares_youtube   + (Number(row.shares_youtube)   || 0),
    shares_mail:      result.shares_mail      + (Number(row.shares_mail)      || 0),
    shares_tiktok:    result.shares_tiktok    + (Number(row.shares_tiktok)    || 0),
  }), { likes: 0, shares: 0, shares_whatsapp: 0, shares_facebook: 0, shares_linkedin: 0, shares_youtube: 0, shares_mail: 0, shares_tiktok: 0 });

  const articles = rows.map((row) => ({
    articleSlug:     String(row.article_slug),
    likes:           Number(row.likes_count)     || 0,
    shares:          Number(row.shares_count)    || 0,
    shares_whatsapp: Number(row.shares_whatsapp) || 0,
    shares_facebook: Number(row.shares_facebook) || 0,
    shares_linkedin: Number(row.shares_linkedin) || 0,
    shares_youtube:  Number(row.shares_youtube)  || 0,
    shares_mail:     Number(row.shares_mail)     || 0,
    shares_tiktok:   Number(row.shares_tiktok)   || 0,
  }));

  return NextResponse.json({ data: { ...totals, articles } });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const articleSlug = typeof body?.articleSlug === 'string' ? body.articleSlug.trim() : '';
  const action = body?.action as EngagementAction;
  const network: ShareNetwork | null = NETWORKS.includes(body?.network) ? body.network : null;

  if (!articleSlug || articleSlug.length > 200 || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Article ou interaction invalide.' }, { status: 400 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Le suivi des articles nécessite la configuration Supabase serveur.' }, { status: 503 });
  }

  const storedVisitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = storedVisitorId && UUID_PATTERN.test(storedVisitorId)
    ? storedVisitorId
    : crypto.randomUUID();

  const { data, error } = await supabaseAdmin.rpc('track_actualites_engagement', {
    p_article_slug: articleSlug,
    p_visitor_id:   visitorId,
    p_action:       action,
    p_network:      network,
  });

  if (error) {
    return NextResponse.json({ error: 'Suivi indisponible. Vérifiez la migration SQL des statistiques.' }, { status: 503 });
  }

  const response = NextResponse.json({ data });
  response.cookies.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
  return response;
}