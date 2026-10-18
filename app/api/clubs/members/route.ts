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
  if (code === '42703') {
    return {
      message: 'Le schéma de la table des clubs est incomplet. Réexécutez la version actuelle de scripts/20_create_clubs.sql sur la base utilisée par l’application.',
      status: 503,
    };
  }

  return {
    message: code
      ? `La base de données a refusé la lecture des membres des clubs (code ${code}). Communiquez ce code au support technique.`
      : 'Impossible de joindre le service des clubs. Vérifiez la connexion PostgreSQL et les journaux de l’application.',
    status: 503,
  };
}

export async function GET() {
  try {
    const { rows } = await getPostgresPool().query(
      `SELECT applications.club_slug AS "clubSlug",
              applications.subclub_slug AS "subclubSlug",
              COALESCE(
                NULLIF(BTRIM(users.user_metadata->>'full_name'), ''),
                NULLIF(BTRIM(users.user_metadata->>'name'), ''),
                SPLIT_PART(users.email, '@', 1)
              ) AS name
       FROM public.club_applications AS applications
       JOIN public.app_users AS users ON users.id = applications.user_id
       WHERE applications.status = 'accepted'
         AND applications.subclub_slug IS NOT NULL
       ORDER BY lower(COALESCE(
         NULLIF(BTRIM(users.user_metadata->>'full_name'), ''),
         NULLIF(BTRIM(users.user_metadata->>'name'), ''),
         SPLIT_PART(users.email, '@', 1)
       ))
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
