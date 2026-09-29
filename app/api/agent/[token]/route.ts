import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DEFAULT_PUBLIC_WHITELIST, RHPublicWhitelist } from '@/types/rh';

// Rate limiting simple en mémoire par IP (max 30 requêtes par minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count++;
  return true;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez patienter avant de scanner à nouveau.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    );
  }

  const { token } = await context.params;
  if (!token || typeof token !== 'string' || token.length < 10) {
    return NextResponse.json(
      { status: 'inconnu', message: 'Identifiant d’agent invalide ou manquant.' },
      { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow' } }
    );
  }

  let profileData: any = null;

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('rh_profiles')
        .select('*')
        .eq('qr_token', token)
        .single();

      if (!error && data) {
        profileData = data;
      }
    } catch {
      // fallback
    }
  }

  // Fallback dev / in-memory si Supabase absent
  if (!profileData) {
    // Vérifier les graines de démonstration
    const seeds = [
      {
        matricule: 'INPTIC-2018-001',
        first_name: 'Arsène',
        last_name: 'BEKALE',
        gender: 'M',
        birth_date: '1974-05-12',
        birth_place: 'Libreville',
        phone: '+241 77 12 34 56',
        email: 'arsene.bekale@inptic.ga',
        photo_url: '/banniere/DG.webp',
        department: 'Direction Générale (DG)',
        position: 'Directeur Général',
        status: 'titulaire',
        is_archived: false,
        qr_token: 'inptic_agent_7f8a9b2c3d4e5f60718293a4b5c6d7e8',
        qr_status: 'actif',
        public_whitelist: { ...DEFAULT_PUBLIC_WHITELIST, email: true },
      },
      {
        matricule: 'INPTIC-2019-014',
        first_name: 'Pauline',
        last_name: 'NDONG MVE',
        gender: 'F',
        birth_date: '1981-11-23',
        birth_place: 'Oyem',
        phone: '+241 66 98 76 54',
        email: 'pauline.ndong@inptic.ga',
        photo_url: '/banniere/DGA.webp',
        department: 'Direction Générale Adjointe (DGA)',
        position: 'Directrice Générale Adjointe',
        status: 'titulaire',
        is_archived: false,
        qr_token: 'inptic_agent_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
        qr_status: 'actif',
        public_whitelist: { ...DEFAULT_PUBLIC_WHITELIST, email: true },
      },
      {
        matricule: 'INPTIC-2021-032',
        first_name: 'Marc',
        last_name: 'ESSONO OBIANG',
        gender: 'M',
        birth_date: '1985-08-19',
        birth_place: 'Port-Gentil',
        phone: '+241 74 55 44 33',
        email: 'marc.essono@inptic.ga',
        photo_url: '',
        department: 'Direction des Ressources Techniques et de l’Innovation (DRTI)',
        position: 'Directeur des Ressources Techniques et de l’Innovation',
        status: 'titulaire',
        is_archived: false,
        qr_token: 'inptic_agent_9f8e7d6c5b4a39281706f5e4d3c2b1a0',
        qr_status: 'actif',
        public_whitelist: { ...DEFAULT_PUBLIC_WHITELIST, email: true },
      },
    ];

    profileData = seeds.find((s) => s.qr_token === token);
  }

  // Profil introuvable
  if (!profileData) {
    return NextResponse.json(
      {
        status: 'inconnu',
        message: 'Ce QR Code ne correspond à aucun profil enregistré auprès de l’INPTIC Gabon.',
      },
      {
        status: 404,
        headers: {
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  // Profil révoqué, inactif ou archivé
  if (profileData.qr_status !== 'actif' || profileData.is_archived) {
    return NextResponse.json(
      {
        status: 'revoque',
        message:
          'Ce QR Code a été révoqué ou désactivé par l’administration de l’INPTIC. La carte n’est plus valide.',
        matricule: profileData.matricule ? `${profileData.matricule.slice(0, 8)}***` : undefined,
      },
      {
        status: 200,
        headers: {
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  // Application stricte de la liste blanche de confidentialité (DRTI-CDC-2026-001)
  const whitelist: RHPublicWhitelist =
    profileData.public_whitelist || DEFAULT_PUBLIC_WHITELIST;

  const publicData: Record<string, any> = {
    status: 'valide',
    verifiedAt: new Date().toISOString(),
    institution: 'Institut National de la Poste, des Technologies de l’Information et de la Communication (INPTIC Gabon)',
    matricule: profileData.matricule,
  };

  if (whitelist.photo) publicData.photoUrl = profileData.photo_url || '';
  if (whitelist.lastName) publicData.lastName = profileData.last_name;
  if (whitelist.firstName) publicData.firstName = profileData.first_name;
  if (whitelist.position) publicData.position = profileData.position;
  if (whitelist.department) publicData.department = profileData.department;
  if (whitelist.status) publicData.agentStatus = profileData.status;

  // Données sensibles activables uniquement par admin
  if (whitelist.gender) publicData.gender = profileData.gender;
  if (whitelist.birthDate) publicData.birthDate = profileData.birth_date;
  if (whitelist.birthPlace) publicData.birthPlace = profileData.birth_place;
  if (whitelist.phone) publicData.phone = profileData.phone;
  if (whitelist.email) publicData.email = profileData.email;

  return NextResponse.json(
    { data: publicData },
    {
      status: 200,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
