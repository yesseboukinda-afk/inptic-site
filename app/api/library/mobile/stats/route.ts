import { getPostgresPool } from '@/lib/postgres';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await getPostgresPool().query<{ total: number }>(
      'SELECT COUNT(*)::int AS total FROM public.library_books WHERE is_public = TRUE',
    );
    return NextResponse.json({ total: Number(rows[0]?.total) || 0 }, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch (error) {
    console.error('[Library mobile API] Stats query failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de récupérer les statistiques.' }, { status: 503 });
  }
}
