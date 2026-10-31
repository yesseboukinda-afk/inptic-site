import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { authorizeSuperAdminRequest } from '@/lib/staff-storage';
import type { PublicSiteContent } from '@/lib/site-content';

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('manage') === '1') {
    const auth = await authorizeSuperAdminRequest(request);
    if (auth.error) return auth.error;
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Base PostgreSQL indisponible.' }, { status: 503 });
  }

  try {
    const [filieres, formations, certifications] = await Promise.all([
      getPostgresPool().query(
        `SELECT id, name, presentation, opportunities
         FROM public.site_tracks
         ORDER BY name`,
      ),
      getPostgresPool().query(
        `SELECT training.id, training.name, training.category, training.track_id,
                track.name AS track_name, training.presentation, training.opportunities
         FROM public.site_trainings AS training
         LEFT JOIN public.site_tracks AS track ON track.id = training.track_id
         WHERE training.is_published = TRUE
         ORDER BY training.category, training.name`,
      ),
      getPostgresPool().query(
        `SELECT id, name, presentation, issuer, duration, website
         FROM public.site_certifications
         ORDER BY name`,
      ),
    ]);
    const data: PublicSiteContent = {
      filieres: filieres.rows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        presentation: String(row.presentation),
        opportunities: Array.isArray(row.opportunities) ? row.opportunities.map(String) : [],
      })),
      formations: formations.rows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        category: row.category === 'diplomante' ? 'diplomante' : 'qualifiante',
        trackId: typeof row.track_id === 'string' ? row.track_id : null,
        trackName: typeof row.track_name === 'string' ? row.track_name : null,
        presentation: String(row.presentation),
        opportunities: Array.isArray(row.opportunities) ? row.opportunities.map(String) : [],
      })),
      certifications: certifications.rows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        presentation: String(row.presentation),
        issuer: typeof row.issuer === 'string' ? row.issuer : null,
        duration: typeof row.duration === 'string' ? row.duration : null,
        website: typeof row.website === 'string' ? row.website : null,
      })),
    };

    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error(
      'Erreur PostgreSQL lors du chargement des contenus du site:',
      error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    );
    return NextResponse.json(
      { error: 'Contenus indisponibles. Vérifiez la migration SQL des contenus du site.' },
      { status: 503 },
    );
  }
}
