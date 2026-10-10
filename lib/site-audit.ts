import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, hashOpaqueToken, AUTH_COOKIE_NAME } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import { isSuperAdminRole, normalizeStaffService } from '@/lib/roles';

function actorSnapshot(user: Awaited<ReturnType<typeof getAuthenticatedUser>>) {
  if (!user) {
    return {
      id: null,
      email: null,
      name: 'Visiteur non authentifié',
      role: 'visiteur',
      service: 'public',
      direction: 'Portail public',
    };
  }

  const metadata = user.user_metadata ?? {};
  const role = isSuperAdminRole(user.role) ? 'superadmin' : user.role;
  const service = normalizeStaffService(metadata.service ?? metadata.department) ||
    (isSuperAdminRole(role) ? 'administration_generale' : role === 'etudiant' ? 'portail_candidat' : 'non_renseigne');
  const direction = typeof metadata.direction === 'string'
    ? metadata.direction.trim().slice(0, 160)
    : typeof metadata.department === 'string'
      ? metadata.department.trim().slice(0, 160)
      : service;
  const name = typeof metadata.full_name === 'string'
    ? metadata.full_name
    : typeof metadata.name === 'string'
      ? metadata.name
      : user.email;

  return {
    id: user.id,
    email: user.email,
    name: name.slice(0, 160),
    role,
    service,
    direction,
  };
}

async function actorFromSessionResponse(response: NextResponse) {
  const token = response.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const { rows } = await getPostgresPool().query<{
    id: string;
    email: string;
    role: string;
    user_metadata: Record<string, unknown>;
  }>(
    `SELECT u.id, u.email, u.role, u.user_metadata
     FROM public.app_sessions s
     JOIN public.app_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.revoked_at IS NULL
     LIMIT 1`,
    [hashOpaqueToken(token)],
  );
  return rows[0] ? actorSnapshot(rows[0]) : null;
}

export function withSiteAudit<T extends (request: NextRequest) => Promise<NextResponse>>(
  action: string,
  handler: T,
  isSuccessfulResponse: (response: NextResponse) => boolean = (response) => response.status < 400,
): T {
  const audited = async (request: NextRequest): Promise<NextResponse> => {
    const user = request.cookies.get(AUTH_COOKIE_NAME)?.value
      ? await getAuthenticatedUser(request)
      : null;
    const actor = actorSnapshot(user);
    const path = new URL(request.url).pathname;
    const method = request.method.toUpperCase();
    let logId: string | null = null;
    try {
      const { rows } = await getPostgresPool().query<{ id: string }>(
        `INSERT INTO public.site_audit_logs
           (actor_id, actor_email, actor_name, actor_role, service, direction,
            action, http_method, route, outcome)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'en_cours')
         RETURNING id`,
        [actor.id, actor.email, actor.name, actor.role, actor.service, actor.direction, action, method, path],
      );
      logId = rows[0]?.id ?? null;
      if (!logId) throw new Error('Aucun identifiant retourné pour le journal de traçabilité.');
    } catch (error) {
      console.error(
        `[Site audit] Impossible de créer l’entrée pour ${method} ${path}; la requête continue sans journal:`,
        error,
      );
    }

    try {
      const response = await handler(request);
      if (logId) {
        try {
          const responseActor = await actorFromSessionResponse(response);
          await getPostgresPool().query(
            `UPDATE public.site_audit_logs
             SET outcome = $2, response_status = $3, completed_at = NOW(),
                 actor_id = COALESCE($4, actor_id), actor_email = COALESCE($5, actor_email),
                 actor_name = COALESCE($6, actor_name), actor_role = COALESCE($7, actor_role),
                 service = COALESCE($8, service), direction = COALESCE($9, direction)
             WHERE id = $1`,
            [
              logId,
              isSuccessfulResponse(response) ? 'succes' : 'echec',
              response.status,
              responseActor?.id ?? null,
              responseActor?.email ?? null,
              responseActor?.name ?? null,
              responseActor?.role ?? null,
              responseActor?.service ?? null,
              responseActor?.direction ?? null,
            ],
          );
        } catch (error) {
          console.error('[Site audit] Impossible de finaliser une entrée de traçabilité:', error);
        }
      }
      return response;
    } catch (error) {
      if (logId) {
        try {
          await getPostgresPool().query(
            `UPDATE public.site_audit_logs
             SET outcome = 'echec', completed_at = NOW()
             WHERE id = $1`,
            [logId],
          );
        } catch (auditError) {
          console.error('[Site audit] Impossible de marquer une action en échec:', auditError);
        }
      }
      throw error;
    }
  };

  return audited as T;
}
