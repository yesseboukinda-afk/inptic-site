import { withSiteAudit } from '@/lib/site-audit';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import { isSuperAdminRole } from '@/lib/roles';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireSuperAdmin(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Session requise.' }, { status: 401 }) };
  }
  if (!isSuperAdminRole(user.role)) {
    return { error: NextResponse.json({ error: 'Accès réservé au superadmin.' }, { status: 403 }) };
  }
  return { user };
}

function parseEmail(value: unknown) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { rows } = await getPostgresPool().query(
      `SELECT email, subscribed_at, is_active, is_blocked
       FROM public.subscribers
       ORDER BY subscribed_at DESC, lower(email)`,
    );
    return NextResponse.json(
      { subscribers: rows },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    console.error('[Admin newsletter GET] PostgreSQL error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json(
      { error: 'Impossible de charger les abonnés à la newsletter.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

async function siteAuditedPATCH(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) return auth.error;

  let body: { email?: unknown; isBlocked?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const email = parseEmail(body.email);
  if (!email || typeof body.isBlocked !== 'boolean') {
    return NextResponse.json({ error: 'Adresse ou état de blocage invalide.' }, { status: 400 });
  }

  try {
    const { rows } = await getPostgresPool().query(
      `UPDATE public.subscribers
       SET is_blocked = $2,
           is_active = CASE WHEN $2 THEN FALSE ELSE is_active END
       WHERE email = $1
       RETURNING email, subscribed_at, is_active, is_blocked`,
      [email, body.isBlocked],
    );
    if (!rows[0]) {
      return NextResponse.json({ error: 'Abonné introuvable.' }, { status: 404 });
    }

    return NextResponse.json(
      { subscriber: rows[0] },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    console.error('[Admin newsletter PATCH] PostgreSQL error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de modifier cet abonné.' }, { status: 503 });
  }
}

async function siteAuditedDELETE(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) return auth.error;

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const email = parseEmail(body.email);
  if (!email) {
    return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  }

  const pool = getPostgresPool();
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query(
      'DELETE FROM public.newsletter_deliveries WHERE subscriber_email = $1',
      [email],
    );
    const result = await client.query(
      'DELETE FROM public.subscribers WHERE email = $1 RETURNING email',
      [email],
    );
    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Abonné introuvable.' }, { status: 404 });
    }
    await client.query('COMMIT');
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('[Admin newsletter DELETE] PostgreSQL error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de supprimer cet abonné.' }, { status: 503 });
  } finally {
    client?.release();
  }
}

export const PATCH = withSiteAudit('Modification du statut d’un abonné newsletter', siteAuditedPATCH);
export const DELETE = withSiteAudit('Suppression d’un abonné newsletter', siteAuditedDELETE);
