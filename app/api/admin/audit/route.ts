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
  const scope = params.get('scope') === 'rh' ? 'rh' : 'site';
  const service = params.get('service')?.trim().slice(0, 80) || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const exportAll = params.get('export') === '1';
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (scope === 'rh') {
    if (search) {
      values.push(`%${search}%`);
      const index = values.length;
      conditions.push(`(
        user_email ILIKE $${index} OR action ILIKE $${index} OR target_name ILIKE $${index}
        OR details ILIKE $${index} OR ip_address ILIKE $${index}
      )`);
    }
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
      values.push(from);
      conditions.push(`timestamp >= $${values.length}::date`);
    }
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
      values.push(to);
      conditions.push(`timestamp < ($${values.length}::date + INTERVAL '1 day')`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
      const pool = getPostgresPool();
      const countResult = await pool.query<{ total: string }>(
        `SELECT COUNT(*)::text AS total FROM public.rh_audit_logs ${where}`,
        values,
      );
      const pageValues = exportAll ? values : [...values, limit, offset];
      const pagination = exportAll ? '' : `LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`;
      const logsResult = await pool.query(
        `SELECT id, user_id, user_email, action, target_id, target_name, details, ip_address, timestamp
         FROM public.rh_audit_logs
         ${where}
         ORDER BY timestamp DESC, id DESC
         ${pagination}`,
        pageValues,
      );

      return NextResponse.json({
        logs: logsResult.rows,
        total: Number(countResult.rows[0]?.total || 0),
        limit: exportAll ? Number(countResult.rows[0]?.total || 0) : limit,
        offset: exportAll ? 0 : offset,
      }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      console.error(
        '[Admin audit RH GET] PostgreSQL error:',
        error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      );
      return NextResponse.json({ error: 'Impossible de charger le journal des opérations RH.' }, { status: 503 });
    }
  }

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
    const pageValues = exportAll ? values : [...values, limit, offset];
    const pagination = exportAll ? '' : `LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`;
    const logsResult = await pool.query(
      `SELECT id, actor_id, actor_email, actor_name, actor_role, service, direction,
              action, http_method, route, outcome, response_status, created_at, completed_at
       FROM public.site_audit_logs
       ${where}
       ORDER BY created_at DESC, id DESC
       ${pagination}`,
      pageValues,
    );

    return NextResponse.json({
      logs: logsResult.rows,
      total: Number(countResult.rows[0]?.total || 0),
      limit: exportAll ? Number(countResult.rows[0]?.total || 0) : limit,
      offset: exportAll ? 0 : offset,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : 'UNKNOWN_ERROR';
    let runtimeContext = '';
    try {
      const { rows } = await getPostgresPool().query<{
        database_name: string;
        database_role: string;
        public_schema_usage: boolean;
        audit_select: boolean;
        audit_insert: boolean;
        audit_update: boolean;
      }>(
        `SELECT current_database() AS database_name,
                current_user AS database_role,
                has_schema_privilege(current_user, 'public', 'USAGE') AS public_schema_usage,
                CASE WHEN to_regclass('public.site_audit_logs') IS NULL THEN FALSE
                     ELSE has_table_privilege(current_user, to_regclass('public.site_audit_logs'), 'SELECT')
                END AS audit_select,
                CASE WHEN to_regclass('public.site_audit_logs') IS NULL THEN FALSE
                     ELSE has_table_privilege(current_user, to_regclass('public.site_audit_logs'), 'INSERT')
                END AS audit_insert,
                CASE WHEN to_regclass('public.site_audit_logs') IS NULL THEN FALSE
                     ELSE has_table_privilege(current_user, to_regclass('public.site_audit_logs'), 'UPDATE')
                END AS audit_update`,
      );
      const context = rows[0];
      if (context) {
        runtimeContext = ` Base ${context.database_name}, rôle ${context.database_role}; ` +
          `public USAGE=${context.public_schema_usage}, ` +
          `site_audit_logs SELECT=${context.audit_select}/INSERT=${context.audit_insert}/UPDATE=${context.audit_update}.`;
      }
    } catch (diagnosticError) {
      console.error(
        '[Admin audit GET] PostgreSQL diagnostics failed:',
        diagnosticError instanceof Error ? diagnosticError.message : 'UNKNOWN_ERROR',
      );
    }
    console.error(
      '[Admin audit GET] PostgreSQL error:',
      code,
      runtimeContext,
      error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    );
    return NextResponse.json(
      { error: `Impossible de charger le journal de traçabilité (PostgreSQL ${code}).` },
      { status: 503 },
    );
  }
}
