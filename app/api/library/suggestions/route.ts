import { getPostgresPool } from '@/lib/postgres';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') || '').trim().slice(0, 100);
  if (query.length < 2) return NextResponse.json({ suggestions: [] });

  try {
    const pattern = `%${query}%`;
    const pool = getPostgresPool();
    const [titles, authors] = await Promise.all([
      pool.query<{ label: string }>(
        `SELECT DISTINCT title AS label FROM public.library_books
         WHERE is_public = TRUE AND title ILIKE $1 ORDER BY label LIMIT 5`,
        [pattern],
      ),
      pool.query<{ label: string }>(
        `SELECT DISTINCT author AS label FROM public.library_books
         WHERE is_public = TRUE AND author ILIKE $1 AND author <> '' AND author <> 'Inconnu'
         ORDER BY label LIMIT 4`,
        [pattern],
      ),
    ]);
    const suggestions = [
      ...titles.rows.map(({ label }) => ({ label, value: label, type: 'titre' })),
      ...authors.rows.map(({ label }) => ({ label, value: label, type: 'auteur' })),
    ].slice(0, 8);
    return NextResponse.json({ suggestions }, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch (error) {
    console.error('[Library API] Search suggestions failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de charger les suggestions.' }, { status: 503 });
  }
}
