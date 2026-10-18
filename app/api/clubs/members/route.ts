import { NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getDatabaseErrorResponse(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
    ? error.code
    : '';

  if (code === '42P01') {
    return {
      message: 'La table des candidatures aux clubs est absente. Vérifiez que scripts/20_create_clubs.sql a été exécuté sur la base de production.',
      status: 503,
    };
  }
  if (code === '42501') {
    return {
      message: 'Le compte PostgreSQL de l’application ne possède pas les droits requis sur les candidatures aux clubs. Réexécutez scripts/20_create_clubs.sql.',
      status: 503,
    };
  }

  return {
    message: 'Impossible de charger la liste des membres des clubs. Vérifiez les journaux PostgreSQL de l’application.',
    status: 503,
  };
}

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
    const databaseError = getDatabaseErrorResponse(error);
    const code = error && typeof error === 'object' && 'code' in error ? error.code : 'UNKNOWN_ERROR';
    console.error('[Club members GET] PostgreSQL error:', code, error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json(
      { error: databaseError.message },
      { status: databaseError.status, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
