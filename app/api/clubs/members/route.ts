import { NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await getPostgresPool().query(
      `SELECT club_slug AS "clubSlug", subclub_slug AS "subclubSlug",
              candidate_name AS name
       FROM public.club_applications
       WHERE status = 'accepted' AND subclub_slug IS NOT NULL
       ORDER BY lower(candidate_name)
       LIMIT 1000`,
    );
    return NextResponse.json(
      { members: rows },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[Club members GET] PostgreSQL error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json(
      { error: 'Impossible de charger la liste des membres des clubs.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
