import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { canAccessStaffService } from '@/lib/roles';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';

export const runtime = 'nodejs';

const EVENT_IDS = ['openDay', 'companiesForum', 'aiConference'] as const;
type AgendaEventId = (typeof EVENT_IDS)[number];
type AgendaEvent = { id: AgendaEventId; date: string; title: string };

function postgresErrorCode(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return 'UNKNOWN';
}

function isAgendaEvents(value: unknown): value is AgendaEvent[] {
  if (!Array.isArray(value) || value.length !== EVENT_IDS.length) return false;
  return value.every((event, index) => {
    if (event === null || typeof event !== 'object') return false;
    const candidate = event as Record<string, unknown>;
    const { date, title } = candidate;
    return candidate.id === EVENT_IDS[index] &&
      typeof date === 'string' &&
      date.trim().length > 0 &&
      date.length <= 40 &&
      typeof title === 'string' &&
      title.trim().length > 0 &&
      title.length <= 180;
  });
}

async function authorizeCommunication(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Session requise. Veuillez vous connecter.' },
        { status: 401 },
      ),
    };
  }

  if (!canAccessStaffService(
    user.role,
    'announcements',
    user.user_metadata.service ?? user.user_metadata.department,
  )) {
    return {
      error: NextResponse.json(
        { error: 'La modification de l’agenda est réservée au service Communication.' },
        { status: 403 },
      ),
    };
  }

  return { user };
}

export async function GET() {
  try {
    const { rows } = await getPostgresPool().query<{ events: unknown }>(
      "SELECT events FROM public.homepage_agenda WHERE id = 'homepage' LIMIT 1",
    );
    const events = rows[0]?.events;

    if (events !== undefined && !isAgendaEvents(events)) {
      console.error('[Homepage agenda GET] Invalid events data stored in PostgreSQL.');
      return NextResponse.json(
        { error: 'Les données de l’agenda sont invalides.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return NextResponse.json(
      { events: events ?? null },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const code = postgresErrorCode(error);
    console.error(
      '[Homepage agenda GET] PostgreSQL error:',
      {
        code,
        message: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      },
    );
    return NextResponse.json(
      {
        error: code === '42P01' || code === '42703'
          ? `Schéma de l’agenda absent ou incomplet (PostgreSQL ${code}). Exécutez scripts/15_repair_homepage_agenda.sql sur la base utilisée par le site.`
          : `Impossible de charger l’agenda (PostgreSQL ${code}). Consultez les journaux serveur pour le détail.`,
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

async function siteAuditedPUT(request: NextRequest) {
  const authorization = await authorizeCommunication(request);
  if (authorization.error) return authorization.error;

  let body: { events?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  if (!isAgendaEvents(body.events)) {
    return NextResponse.json(
      { error: 'L’agenda doit contenir les trois événements avec une date et un intitulé valides.' },
      { status: 400 },
    );
  }

  try {
    const { rows } = await getPostgresPool().query<{ events: AgendaEvent[] }>(
      `INSERT INTO public.homepage_agenda (id, events, updated_by, updated_at)
       VALUES ('homepage', $1::jsonb, $2, NOW())
       ON CONFLICT (id) DO UPDATE
       SET events = EXCLUDED.events, updated_by = EXCLUDED.updated_by, updated_at = NOW()
       RETURNING events`,
      [JSON.stringify(body.events), authorization.user.id],
    );

    return NextResponse.json(
      { events: rows[0].events },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const code = postgresErrorCode(error);
    console.error(
      '[Homepage agenda PUT] PostgreSQL error:',
      {
        code,
        message: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      },
    );
    return NextResponse.json(
      {
        error: code === '42P01' || code === '42703' || code === '42P10'
          ? `Schéma de l’agenda absent ou incompatible (PostgreSQL ${code}). Exécutez scripts/15_repair_homepage_agenda.sql sur la base utilisée par le site.`
          : `Impossible d’enregistrer l’agenda (PostgreSQL ${code}). Consultez les journaux serveur pour le détail.`,
      },
      { status: 503 },
    );
  }
}

export const PUT = withSiteAudit("Modification de l’agenda de l’accueil", siteAuditedPUT);
