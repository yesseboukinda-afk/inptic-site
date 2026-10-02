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

  const body = await request.json().catch(() => null);
  const concoursSlug = typeof body?.concoursSlug === 'string' ? body.concoursSlug.trim() : '';
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';

  if (!concoursSlug || fullName.length < 2 || fullName.length > 160 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      phone.length < 6 || phone.length > 30 || body?.consent !== true) {
    return NextResponse.json({ error: 'Vérifiez vos coordonnées et confirmez votre consentement.' }, { status: 400 });
  }

  const { data: concours, error: concoursError } = await supabaseAdmin
    .from('concours')
    .select('slug, status, calendar')
    .eq('slug', concoursSlug)
    .maybeSingle();
  if (concoursError) return NextResponse.json({ error: 'Vérification du concours impossible.' }, { status: 503 });
  const registrationEnd = concours?.calendar?.registrationEnd;
  const registrationClosed = typeof registrationEnd === 'string' && new Date(registrationEnd).getTime() < Date.now();
  if (!concours || concours.status === 'termine' || registrationClosed) {
    return NextResponse.json({ error: 'Les préinscriptions à ce concours ne sont pas ouvertes.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('concours_preinscriptions').insert({
    concours_slug: concoursSlug,
    full_name: fullName,
    email,
    phone,
    consented_at: new Date().toISOString(),
  });
  if (error?.code === '23505') {
    return NextResponse.json({ error: 'Cette adresse e-mail est déjà préinscrite à ce concours.' }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: 'Enregistrement impossible. Réessayez plus tard.' }, { status: 500 });

  return NextResponse.json({ success: true }, { status: 201 });
}