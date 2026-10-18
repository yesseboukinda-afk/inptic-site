import { randomBytes, createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { getPostgresPool } from '@/lib/postgres';
import { CLUBS, findClub } from '@/lib/clubs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VOTER_COOKIE = 'inptic_club_voter';
const VOTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getVoterToken(request: NextRequest) {
  const existing = request.cookies.get(VOTER_COOKIE)?.value;
  if (existing && /^[a-f0-9]{64}$/.test(existing)) {
    return { token: existing, isNew: false };
  }
  return { token: randomBytes(32).toString('hex'), isNew: true };
}

function hashVoterToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function setVoterCookie(response: NextResponse, token: string) {
  response.cookies.set(VOTER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: VOTER_COOKIE_MAX_AGE,
  });
}

function unavailable(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
    ? error.code
    : '';
  const message = code === '42P01'
    ? 'La table des likes des clubs manque dans la base. Réexécutez scripts/20_create_clubs.sql.'
    : code === '42501'
      ? 'Le compte PostgreSQL du site ne peut pas accéder aux likes des clubs. Réexécutez scripts/20_create_clubs.sql.'
      : code
        ? `Erreur PostgreSQL lors du chargement des likes (code ${code}).`
        : 'Connexion à la base PostgreSQL indisponible.';
  console.error('[Club likes API] PostgreSQL error:', code || 'UNKNOWN_ERROR', error instanceof Error ? error.message : '');
  return NextResponse.json({ error: message }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request: NextRequest) {
  const { token, isNew } = getVoterToken(request);
  try {
    const { rows } = await getPostgresPool().query(
      `SELECT club_slug AS "clubSlug",
              COUNT(*)::int AS likes,
              BOOL_OR(voter_token_hash = $1) AS liked
       FROM public.club_likes
       GROUP BY club_slug`,
      [hashVoterToken(token)],
    );
    const votes = new Map<string, { likes: number; liked: boolean }>(
      rows.map((row) => [row.clubSlug, { likes: row.likes, liked: row.liked }]),
    );
    let previousLikes = -1;
    let previousRank = 0;
    const ranked = CLUBS.map((club) => ({
      clubSlug: club.slug,
      likes: votes.get(club.slug)?.likes ?? 0,
      liked: votes.get(club.slug)?.liked ?? false,
    }))
      .sort((left, right) => right.likes - left.likes)
      .map((club, index) => {
        const rank = club.likes === 0
          ? 0
          : club.likes === previousLikes
            ? previousRank
            : index + 1;
        previousLikes = club.likes;
        previousRank = rank;
        return { ...club, rank };
      });

    const response = NextResponse.json(
      { clubs: ranked },
      { headers: { 'Cache-Control': 'no-store' } },
    );
    if (isNew) setVoterCookie(response, token);
    return response;
  } catch (error) {
    return unavailable(error);
  }
}

export async function POST(request: NextRequest) {
  let body: { clubSlug?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  if (!findClub(body.clubSlug)) {
    return NextResponse.json({ error: 'Club invalide.' }, { status: 400 });
  }

  const { token, isNew } = getVoterToken(request);
  const voterHash = hashVoterToken(token);
  const pool = getPostgresPool();
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [body.clubSlug, voterHash]);
    const existing = await client.query(
      'SELECT 1 FROM public.club_likes WHERE club_slug = $1 AND voter_token_hash = $2',
      [body.clubSlug, voterHash],
    );
    const liked = existing.rowCount === 0;
    if (liked) {
      await client.query(
        'INSERT INTO public.club_likes (club_slug, voter_token_hash) VALUES ($1, $2)',
        [body.clubSlug, voterHash],
      );
    } else {
      await client.query(
        'DELETE FROM public.club_likes WHERE club_slug = $1 AND voter_token_hash = $2',
        [body.clubSlug, voterHash],
      );
    }
    await client.query('COMMIT');
    const response = NextResponse.json(
      { clubSlug: body.clubSlug, liked },
      { headers: { 'Cache-Control': 'no-store' } },
    );
    if (isNew) setVoterCookie(response, token);
    return response;
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    return unavailable(error);
  } finally {
    client?.release();
  }
}
