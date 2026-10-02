import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const VISITOR_COOKIE = 'inptic_analytics_id';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIONS = ['view', 'like', 'share'] as const;
type EngagementAction = (typeof ACTIONS)[number];

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Statistiques indisponibles.' }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin
    .from('actualites_engagement_counters')
    .select('article_slug, likes_count, shares_count')
    .like('article_slug', 'tech-%');

  if (error) return NextResponse.json({ error: 'Statistiques indisponibles.' }, { status: 503 });

  const totals = (data || []).reduce((result, row) => ({
    likes: result.likes + (Number(row.likes_count) || 0),
    shares: result.shares + (Number(row.shares_count) || 0),
  }), { likes: 0, shares: 0 });

  const articles = (data || []).map((row) => ({
    articleSlug: String(row.article_slug),
    likes: Number(row.likes_count) || 0,
    shares: Number(row.shares_count) || 0,
  }));

  return NextResponse.json({ data: { ...totals, articles } });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const articleSlug = typeof body?.articleSlug === 'string' ? body.articleSlug.trim() : '';
  const action = body?.action as EngagementAction;

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
    p_visitor_id: visitorId,
    p_action: action,
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