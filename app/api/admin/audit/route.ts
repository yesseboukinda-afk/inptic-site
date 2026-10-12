import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import { isSuperAdminRole } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Session requise.' }, { status: 401 });
  }
  if (!isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: 'Accès réservé au superadmin.' }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(params.get('limit')) || 50, 1), 100);
  const offset = Math.max(Number(params.get('offset')) || 0, 0);
  const search = params.get('q')?.trim().slice(0, 120) || '';
  const service = params.get('service')?.trim().slice(0, 80) || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (search) {
    values.push(`%${search}%`);
    const index = values.length;
    conditions.push(`(
      actor_email ILIKE $${index} OR actor_name ILIKE $${index} OR action ILIKE $${index}
      OR http_method ILIKE $${index} OR route ILIKE $${index} OR direction ILIKE $${index}
      OR service ILIKE $${index} OR actor_role ILIKE $${index}
    )`);
  }
  if (service) {
    values.push(service);
    conditions.push(`service = $${values.length}`);
  }
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
    values.push(from);
    conditions.push(`created_at >= $${values.length}::date`);
  }
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    values.push(to);
    conditions.push(`created_at < ($${values.length}::date + INTERVAL '1 day')`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const pool = getPostgresPool();
    const countResult = await pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM public.site_audit_logs ${where}`,
      values,
    );
    const pageValues = [...values, limit, offset];
    const logsResult = await pool.query(
      `SELECT id, actor_id, actor_email, actor_name, actor_role, service, direction,
              action, http_method, route, outcome, response_status, created_at, completed_at
       FROM public.site_audit_logs
       ${where}
       ORDER BY created_at DESC, id DESC
       LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`,
      pageValues,
    );

    return NextResponse.json({
      logs: logsResult.rows,
      total: Number(countResult.rows[0]?.total || 0),
      limit,
      offset,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Admin audit GET] PostgreSQL error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de charger le journal de traçabilité.' }, { status: 503 });
  }
}
