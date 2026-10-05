import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  isAdminAccountEmail,
  isAdminRole,
  isCommunicationRole,
  isDirectorAccountEmail,
  isDirectorRole,
  normalizeRole,
} from '@/lib/roles';

async function authorizeStaff(request: NextRequest) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || !supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const role = normalizeRole(
    data.user.app_metadata?.role ?? data.user.app_metadata?.roles ??
    data.user.user_metadata?.role ?? data.user.user_metadata?.roles
  );
  const email = data.user.email || '';
  return isAdminRole(role) || isDirectorRole(role) || isCommunicationRole(role) ||
    role === 'scolarite' || role === 'direction_etudes' ||
    isAdminAccountEmail(email) || isDirectorAccountEmail(email);
}

export async function GET(request: NextRequest) {
  if (!await authorizeStaff(request)) {
    return NextResponse.json({ error: 'Accès réservé au personnel autorisé.' }, { status: 403 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Service Supabase indisponible.' }, { status: 503 });
  }

  const concoursSlug = request.nextUrl.searchParams.get('concours');
  let query = supabaseAdmin
    .from('concours_preinscriptions')
    .select('*')
    .order('created_at', { ascending: false });
  if (concoursSlug) query = query.eq('concours_slug', concoursSlug);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Impossible de charger les préinscriptions.' }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Service de préinscription indisponible.' }, { status: 503 });
  }

  const accessToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return NextResponse.json({ error: 'Connectez-vous à votre compte candidat avant de vous préinscrire.' }, { status: 401 });
  }
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
  if (authError || !authData.user?.email) {
    return NextResponse.json({ error: 'Votre session candidat a expiré. Reconnectez-vous pour continuer.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const concoursSlug = typeof body?.concoursSlug === 'string' ? body.concoursSlug.trim() : null;
  const metadataName = authData.user.user_metadata?.full_name ?? authData.user.user_metadata?.name;
  const fullName = typeof body?.fullName === 'string' && body.fullName.trim()
    ? body.fullName.trim()
    : typeof metadataName === 'string' && metadataName.trim()
      ? metadataName.trim()
      : authData.user.email.split('@')[0];
  const email = authData.user.email.trim().toLowerCase();

  if (fullName.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Les informations du compte candidat ne sont pas valides.' }, { status: 400 });
  }

  if (concoursSlug) {
    const { data: concours, error: concoursError } = await supabaseAdmin
      .from('concours')
      .select('slug, status, calendar')
      .eq('slug', concoursSlug)
      .maybeSingle();
    if (concoursError) return NextResponse.json({ error: 'Vérification du concours impossible.' }, { status: 503 });
    const registrationEnd = concours?.calendar?.registrationEnd;
    const registrationStart = concours?.calendar?.registrationStart;
    const registrationNotStarted =
      typeof registrationStart === 'string' && new Date(registrationStart).getTime() > Date.now();
    const registrationClosed = typeof registrationEnd === 'string' && new Date(registrationEnd).getTime() < Date.now();
    if (!concours || concours.status !== 'en_cours' || registrationNotStarted || registrationClosed) {
      return NextResponse.json({ error: 'La session sélectionnée n’est pas ouverte aux préinscriptions.' }, { status: 400 });
    }
  }

  const { error } = await supabaseAdmin.from('concours_preinscriptions').upsert({
    user_id: authData.user.id,
    concours_slug: concoursSlug,
    full_name: fullName,
    email,
  }, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: 'Enregistrement impossible. Réessayez plus tard.' }, { status: 500 });

  return NextResponse.json({ success: true }, { status: 201 });
}