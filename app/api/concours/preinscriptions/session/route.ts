import { NextRequest, NextResponse } from 'next/server';
import { withSiteAudit } from '@/lib/site-audit';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import { canAccessStaffService } from '@/lib/roles';

async function siteAuditedPATCH(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 });
  }
  if (!canAccessStaffService(user.role, 'preinscriptions', user.user_metadata.service ?? user.user_metadata.department)) {
    return NextResponse.json({ error: 'Accès non autorisé à la gestion des préinscriptions.' }, { status: 403 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'La base PostgreSQL n’est pas configurée.' }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const concoursSlug = typeof body?.concours === 'string' ? body.concours.trim() : '';
  if (!/^[a-z0-9][a-z0-9-]{0,159}$/i.test(concoursSlug) || typeof body?.open !== 'boolean') {
    return NextResponse.json({ error: 'Concours ou état de session invalide.' }, { status: 400 });
  }

  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');

    if (body.open) {
      await client.query(
        `UPDATE public.concours
         SET calendar = jsonb_set(COALESCE(calendar, '{}'::jsonb), '{registrationOpen}', 'false'::jsonb, true),
             updated_at = NOW()
         WHERE slug <> $1 AND calendar->>'registrationOpen' = 'true'`,
        [concoursSlug],
      );
    }

    const { rows } = await client.query(
      `UPDATE public.concours
       SET calendar = jsonb_set(COALESCE(calendar, '{}'::jsonb), '{registrationOpen}', $1::jsonb, true),
           updated_at = NOW()
       WHERE slug = $2 AND status <> 'termine'
       RETURNING id, slug, title, calendar`,
      [JSON.stringify(body.open), concoursSlug],
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Concours introuvable ou déjà terminé.' }, { status: 404 });
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch((rollbackError: unknown) => {
      console.error('Impossible d’annuler le changement de session:', rollbackError);
    });
    console.error('Erreur lors du changement de session de préinscription:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Modification de la session de préinscription impossible.' }, { status: 503 });
  } finally {
    client.release();
  }
}

export const PATCH = withSiteAudit('Ouverture ou fermeture de la session de préinscription', siteAuditedPATCH);
