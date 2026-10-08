import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { canAccessStaffService } from '@/lib/roles';

async function authorizeStaff(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return null;
  return canAccessStaffService(user.role, 'preinscriptions', user.user_metadata.service ?? user.user_metadata.department);
}

export async function GET(request: NextRequest) {
  if (!await authorizeStaff(request)) {
    return NextResponse.json({ error: 'Accès réservé au personnel autorisé.' }, { status: 403 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Base PostgreSQL indisponible.' }, { status: 503 });
  }

  const concoursSlug = request.nextUrl.searchParams.get('concours');
  try {
    const { rows } = await getPostgresPool().query(
      `SELECT * FROM public.concours_preinscriptions
       WHERE ($1::text IS NULL OR concours_slug = $1)
       ORDER BY created_at DESC`,
      [concoursSlug],
    );
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Erreur PostgreSQL lors du chargement des préinscriptions:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de charger les préinscriptions.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Service de préinscription indisponible.' }, { status: 503 });
  }

  const user = await getAuthenticatedUser(request);
  if (!user?.email) {
    return NextResponse.json({ error: 'Connectez-vous à votre compte candidat avant de vous préinscrire.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const concoursSlug = typeof body?.concoursSlug === 'string' ? body.concoursSlug.trim() : null;
  const metadataName = user.user_metadata.full_name ?? user.user_metadata.name;
  const fullName = typeof body?.fullName === 'string' && body.fullName.trim()
    ? body.fullName.trim()
    : typeof metadataName === 'string' && metadataName.trim()
      ? metadataName.trim()
      : user.email.split('@')[0];
  const email = user.email.trim().toLowerCase();

  if (fullName.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Les informations du compte candidat ne sont pas valides.' }, { status: 400 });
  }

  if (concoursSlug) {
    let concours;
    try {
      const { rows } = await getPostgresPool().query(
        'SELECT slug, status, calendar FROM public.concours WHERE slug = $1',
        [concoursSlug],
      );
      concours = rows[0];
    } catch (error) {
      console.error('Erreur PostgreSQL lors de la vérification du concours:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json({ error: 'Vérification du concours impossible.' }, { status: 503 });
    }
    const registrationEnd = concours?.calendar?.registrationEnd;
    const registrationStart = concours?.calendar?.registrationStart;
    const registrationNotStarted =
      typeof registrationStart === 'string' && new Date(registrationStart).getTime() > Date.now();
    const registrationClosed = typeof registrationEnd === 'string' && new Date(registrationEnd).getTime() < Date.now();
    if (!concours || concours.status !== 'en_cours' || registrationNotStarted || registrationClosed) {
      return NextResponse.json({ error: 'La session sélectionnée n’est pas ouverte aux préinscriptions.' }, { status: 400 });
    }
  }

  try {
    await getPostgresPool().query(
      `INSERT INTO public.concours_preinscriptions
         (user_id, concours_slug, full_name, email)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE
       SET concours_slug = EXCLUDED.concours_slug,
           full_name = EXCLUDED.full_name,
           email = EXCLUDED.email`,
      [user.id, concoursSlug, fullName, email],
    );
  } catch (error) {
    console.error('Erreur PostgreSQL lors de l’enregistrement de la préinscription:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Enregistrement impossible. Réessayez plus tard.' }, { status: 503 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}