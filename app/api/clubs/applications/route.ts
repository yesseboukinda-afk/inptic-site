import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { findClub, findClubSubclub } from '@/lib/clubs';
import { isStandardAdminRole, isSuperAdminRole, normalizeStaffService } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function managerClub(user: Awaited<ReturnType<typeof getAuthenticatedUser>>) {
  if (!user) return null;
  if (isSuperAdminRole(user.role)) return 'all';
  const service = normalizeStaffService(user.user_metadata.service ?? user.user_metadata.department);
  const slug = user.user_metadata.clubSlug;
  if (isStandardAdminRole(user.role) && service === 'clubs' && findClub(slug)) return slug;
  return null;
}

function unavailable(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
    ? error.code
    : '';
  const message = code === '42P01'
    ? 'La table des candidatures est absente de cette base PostgreSQL. Exécutez scripts/20_create_clubs.sql sur la base utilisée par le site.'
    : code === '42501'
      ? 'Le compte PostgreSQL du site n’a pas les droits de lecture sur les candidatures. Exécutez la version actuelle de scripts/20_create_clubs.sql.'
      : code === '42703'
        ? 'La table des candidatures existe, mais certaines colonnes manquent. Exécutez la version actuelle de scripts/20_create_clubs.sql.'
        : code
          ? `Erreur PostgreSQL lors de l’accès aux candidatures (code ${code}). Vérifiez les journaux de l’application.`
          : 'Connexion à la base PostgreSQL indisponible. Vérifiez les journaux de l’application.';
  return NextResponse.json(
    { error: message },
    { status: 503 },
  );
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Connectez-vous pour consulter votre candidature.' }, { status: 401 });

  const assignment = managerClub(user);
  try {
    if (assignment) {
      const { rows } = await getPostgresPool().query(
        `SELECT id, user_id AS "userId", candidate_name AS "candidateName",
                candidate_email AS "candidateEmail", club_slug AS "clubSlug",
                subclub_slug AS "subclubSlug", activity, motivation, status,
                decision_note AS "decisionNote",
                created_at AS "createdAt"
         FROM public.club_applications
         WHERE ($1::text = 'all' OR club_slug = $1)
         ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC
         LIMIT 300`,
        [assignment],
      );
      return NextResponse.json(
        { mode: 'manager', clubSlug: assignment, applications: rows },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    if (user.role !== 'etudiant') {
      return NextResponse.json({ error: 'Cet espace est réservé aux étudiants et aux responsables de clubs.' }, { status: 403 });
    }
    const { rows } = await getPostgresPool().query(
      `SELECT id, club_slug AS "clubSlug", subclub_slug AS "subclubSlug", activity, motivation, status,
              decision_note AS "decisionNote", created_at AS "createdAt"
       FROM public.club_applications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [user.id],
    );
    return NextResponse.json(
      { mode: 'student', applications: rows },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : 'UNKNOWN_ERROR';
    console.error('[Club applications GET] PostgreSQL error:', code, error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return unavailable(error);
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Connectez-vous pour envoyer une candidature.' }, { status: 401 });
  if (user.role !== 'etudiant') {
    return NextResponse.json({ error: 'Seuls les étudiants peuvent candidater à un club.' }, { status: 403 });
  }

  let body: { clubSlug?: unknown; subclubSlug?: unknown; motivation?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  const club = findClub(body.clubSlug);
  const subclub = findClubSubclub(body.clubSlug, body.subclubSlug);
  const motivation = typeof body.motivation === 'string' ? body.motivation.trim() : '';
  if (!club || !subclub) {
    return NextResponse.json({ error: 'Choisissez un club et un sous-club valides.' }, { status: 400 });
  }
  if (motivation.length > 1000) {
    return NextResponse.json({ error: 'La motivation ne peut pas dépasser 1 000 caractères.' }, { status: 400 });
  }

  try {
    const { rows } = await getPostgresPool().query(
      `INSERT INTO public.club_applications
         (user_id, candidate_name, candidate_email, club_slug, subclub_slug, activity, motivation)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, club_slug AS "clubSlug", subclub_slug AS "subclubSlug",
                 activity, motivation, status,
                 decision_note AS "decisionNote", created_at AS "createdAt"`,
      [
        user.id,
        String(user.user_metadata.full_name ?? user.user_metadata.name ?? '').trim().slice(0, 120) || user.email,
        user.email,
        club.slug,
        subclub.slug,
        subclub.name,
        motivation,
      ],
    );
    return NextResponse.json({ application: rows[0] }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (code === '23505') {
      return NextResponse.json(
        { error: 'Vous avez déjà une candidature en cours ou êtes déjà membre d’un club. Attendez la décision du responsable.' },
        { status: 409 },
      );
    }
    console.error('[Club applications POST] PostgreSQL error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return unavailable(error);
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Session requise.' }, { status: 401 });
  const assignment = managerClub(user);
  if (!assignment) return NextResponse.json({ error: 'Accès réservé aux responsables de clubs.' }, { status: 403 });

  let body: { id?: unknown; decision?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  const id = typeof body.id === 'string' ? body.id : '';
  const decision = body.decision;
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ||
      (decision !== 'accepted' && decision !== 'rejected') || note.length > 500) {
    return NextResponse.json({ error: 'Décision ou identifiant invalide.' }, { status: 400 });
  }

  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const application = await client.query(
      `SELECT id, user_id, club_slug, status
       FROM public.club_applications WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const current = application.rows[0];
    if (!current || (assignment !== 'all' && current.club_slug !== assignment)) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Candidature introuvable pour votre club.' }, { status: 404 });
    }
    if (current.status !== 'pending') {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Cette candidature a déjà été traitée.' }, { status: 409 });
    }

    const { rows } = await client.query(
      `UPDATE public.club_applications
       SET status = $2, decision_note = NULLIF($3, ''), decided_by = $4, updated_at = NOW()
       WHERE id = $1
       RETURNING id, status, decision_note AS "decisionNote"`,
      [id, decision, note, user.id],
    );
    await client.query('COMMIT');
    return NextResponse.json({ application: rows[0] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (code === '23505') {
      return NextResponse.json(
        { error: 'Cet étudiant est déjà membre ou a une candidature active dans un autre club.' },
        { status: 409 },
      );
    }
    console.error('[Club applications PATCH] PostgreSQL error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return unavailable(error);
  } finally {
    client.release();
  }
}
