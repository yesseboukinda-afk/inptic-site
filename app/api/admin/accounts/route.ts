import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { getAuthenticatedUser, hashPassword } from '@/lib/postgres-auth';
import { findClub } from '@/lib/clubs';
import {
  isSuperAdminRole,
  normalizeStaffService,
  serviceAssignmentForRole,
} from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LEGACY_STAFF_ROLES = [
  'superadmin',
  'admin',
  'administrateur',
  'administrator',
  'directeur',
  'dg',
  'director',
  'directeur_general',
  'scolarite',
  'direction_etudes',
  'communication',
  'responsable_communication',
  'responsable_de_communication',
  'rh',
  'drh',
  'rh_admin',
  'rh_gestionnaire',
  'rh_consultation',
];

async function requireSuperAdmin(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return {
      error: NextResponse.json({ error: 'Session requise.' }, { status: 401 }),
    };
  }
  if (!isSuperAdminRole(user.role)) {
    return {
      error: NextResponse.json({ error: 'Accès réservé au superadmin.' }, { status: 403 }),
    };
  }
  return { user };
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { rows } = await getPostgresPool().query(
      `SELECT id, email, role, user_metadata, email_verified_at, created_at
       FROM public.app_users
       WHERE role = ANY($1::text[])
       ORDER BY lower(COALESCE(user_metadata->>'department', '')), lower(email)`,
      [LEGACY_STAFF_ROLES],
    );

    return NextResponse.json({
      accounts: rows.map((row) => {
        const service = normalizeStaffService(row.user_metadata?.service || row.user_metadata?.department) ||
          serviceAssignmentForRole(row.role);
        return {
          id: row.id,
          email: row.email,
          role: isSuperAdminRole(row.role) ? 'superadmin' : 'admin',
          name: row.user_metadata?.full_name || row.user_metadata?.name || '',
          department: service,
          clubSlug: row.user_metadata?.clubSlug || '',
          emailVerified: Boolean(row.email_verified_at),
          createdAt: row.created_at,
        };
      }),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Admin accounts GET] PostgreSQL error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de charger les comptes du personnel.' }, { status: 503 });
  }
}

async function siteAuditedPOST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) return auth.error;

  let body: {
    email?: unknown;
    name?: unknown;
    password?: unknown;
    role?: unknown;
    service?: unknown;
    department?: unknown;
    clubSlug?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const role = typeof body.role === 'string' ? body.role : '';
  const department = normalizeStaffService(body.service ?? body.department);
  const club = role === 'admin' && department === 'clubs' ? findClub(body.clubSlug) : undefined;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  }
  if (!name || !password || password.length > 256) {
    return NextResponse.json({ error: 'Nom et mot de passe requis (256 caractères maximum).' }, { status: 400 });
  }
  if (role !== 'admin' && role !== 'superadmin') {
    return NextResponse.json({ error: 'Les seuls rôles disponibles sont Admin et Superadmin.' }, { status: 400 });
  }
  if (role === 'admin' && !department) {
    return NextResponse.json({ error: 'Attribue un service à ce compte admin.' }, { status: 400 });
  }
  if (role === 'admin' && department === 'clubs' && !club) {
    return NextResponse.json({ error: 'Attribue un club valide à ce responsable.' }, { status: 400 });
  }
  const assignedService = role === 'admin' ? department : '';

  try {
    const pool = getPostgresPool();
    const passwordHash = await hashPassword(password);
    const metadata = JSON.stringify({
      name,
      full_name: name,
      role,
      department: assignedService,
      service: assignedService,
      ...(club ? { clubSlug: club.slug } : {}),
    });
    const { rows } = await pool.query(
      `INSERT INTO public.app_users
         (email, password_hash, role, user_metadata, email_verified_at, must_reset_password)
       VALUES ($1, $2, $3, $4::jsonb, NOW(), FALSE)
       RETURNING id, email, role, user_metadata, email_verified_at, created_at`,
      [email, passwordHash, role, metadata],
    );
    const account = rows[0];

    return NextResponse.json({
      account: {
        id: account.id,
        email: account.email,
        role: account.role,
        name: account.user_metadata?.full_name || account.user_metadata?.name || '',
        department: account.user_metadata?.service || account.user_metadata?.department || '',
        clubSlug: account.user_metadata?.clubSlug || '',
        emailVerified: Boolean(account.email_verified_at),
        createdAt: account.created_at,
      },
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (code === '23505') {
      return NextResponse.json({ error: 'Un compte existe déjà avec cette adresse e-mail.' }, { status: 409 });
    }
    console.error('[Admin accounts POST] PostgreSQL error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de créer le compte.' }, { status: 503 });
  }
}

async function siteAuditedDELETE(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) return auth.error;

  let body: { id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  const id = typeof body.id === 'string' ? body.id : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Identifiant de compte invalide.' }, { status: 400 });
  }
  if (id === auth.user.id) {
    return NextResponse.json({ error: 'Tu ne peux pas supprimer ton propre compte.' }, { status: 400 });
  }

  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE public.app_users IN SHARE ROW EXCLUSIVE MODE');
    const target = await client.query(
      'SELECT id, role FROM public.app_users WHERE id = $1 FOR UPDATE',
      [id],
    );
    if (!target.rows[0]) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
    }
    if (isSuperAdminRole(target.rows[0].role)) {
      const superadmins = await client.query(
        `SELECT COUNT(*)::int AS count FROM public.app_users WHERE role = 'superadmin'`,
      );
      if (superadmins.rows[0].count <= 1) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Impossible de supprimer le dernier compte superadmin.' }, { status: 409 });
      }
    }

    await client.query('DELETE FROM public.app_users WHERE id = $1', [id]);
    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Admin accounts DELETE] PostgreSQL error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de supprimer le compte.' }, { status: 503 });
  } finally {
    client.release();
  }
}

export const POST = withSiteAudit("Création de compte du personnel", siteAuditedPOST);
export const DELETE = withSiteAudit("Suppression de compte du personnel", siteAuditedDELETE);
