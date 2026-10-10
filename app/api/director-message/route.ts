import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { canAccessStaffService } from '@/lib/roles';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';

export const runtime = 'nodejs';

type DirectorMessage = {
  title: string;
  text: string;
  name: string;
  role: string;
};

function postgresErrorCode(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return 'UNKNOWN';
}

function isDirectorMessage(value: unknown): value is DirectorMessage {
  if (value === null || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.title === 'string' && candidate.title.trim().length > 0 && candidate.title.length <= 180 &&
    typeof candidate.text === 'string' && candidate.text.trim().length > 0 && candidate.text.length <= 3000 &&
    typeof candidate.name === 'string' && candidate.name.trim().length > 0 && candidate.name.length <= 120 &&
    typeof candidate.role === 'string' && candidate.role.trim().length > 0 && candidate.role.length <= 120
  );
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
        { error: 'La modification du message du DG est réservée au service Communication.' },
        { status: 403 },
      ),
    };
  }

  return { user };
}

export async function GET() {
  try {
    const { rows } = await getPostgresPool().query<{ content: unknown }>(
      "SELECT content FROM public.homepage_director_message WHERE id = 'homepage' LIMIT 1",
    );
    const content = rows[0]?.content;

    if (content !== undefined && !isDirectorMessage(content)) {
      console.error('[Director message GET] Invalid content stored in PostgreSQL.');
      return NextResponse.json(
        { error: 'Les données du message du DG sont invalides.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return NextResponse.json(
      { content: content ?? null },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const code = postgresErrorCode(error);
    console.error('[Director message GET] PostgreSQL error:', {
      code,
      message: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    });
    return NextResponse.json(
      {
        error: code === '42P01' || code === '42703'
          ? `Schéma du message du DG absent ou incomplet (PostgreSQL ${code}). Exécutez scripts/16_create_homepage_director_message.sql sur la base utilisée par le site.`
          : `Impossible de charger le message du DG (PostgreSQL ${code}). Consultez les journaux serveur pour le détail.`,
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

async function siteAuditedPUT(request: NextRequest) {
  const authorization = await authorizeCommunication(request);
  if (authorization.error) return authorization.error;

  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  if (!isDirectorMessage(body.content)) {
    return NextResponse.json(
      { error: 'Le titre, le texte, le nom et la fonction doivent être renseignés et respecter les limites de longueur.' },
      { status: 400 },
    );
  }

  try {
    const { rows } = await getPostgresPool().query<{ content: DirectorMessage }>(
      `INSERT INTO public.homepage_director_message (id, content, updated_by, updated_at)
       VALUES ('homepage', $1::jsonb, $2, NOW())
       ON CONFLICT (id) DO UPDATE
       SET content = EXCLUDED.content, updated_by = EXCLUDED.updated_by, updated_at = NOW()
       RETURNING content`,
      [JSON.stringify(body.content), authorization.user.id],
    );

    return NextResponse.json(
      { content: rows[0].content },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const code = postgresErrorCode(error);
    console.error('[Director message PUT] PostgreSQL error:', {
      code,
      message: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    });
    return NextResponse.json(
      {
        error: code === '42P01' || code === '42703' || code === '42P10'
          ? `Schéma du message du DG absent ou incompatible (PostgreSQL ${code}). Exécutez scripts/16_create_homepage_director_message.sql sur la base utilisée par le site.`
          : `Impossible d’enregistrer le message du DG (PostgreSQL ${code}). Consultez les journaux serveur pour le détail.`,
      },
      { status: 503 },
    );
  }
}

export const PUT = withSiteAudit("Modification du message de la Direction", siteAuditedPUT);
