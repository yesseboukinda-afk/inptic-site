import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { normalizeRHPublicWhitelist, RHPublicWhitelist } from '@/types/rh';
import { logRHCardScan } from '@/lib/rh-card-audit';

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

  let profileData: any;
  try {
    const { rows } = await getPostgresPool().query(
      'SELECT * FROM public.rh_profiles WHERE qr_token = $1 LIMIT 1',
      [token],
    );
    profileData = rows[0];
  } catch (error) {
    console.error('Erreur PostgreSQL lors de la vérification du badge RH:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Service de vérification temporairement indisponible.' }, { status: 503 });
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

  try {
    await logRHCardScan(profileData, request.headers);
  } catch (error) {
    console.error('Erreur PostgreSQL lors de la journalisation du scan de carte RH:', {
      profileId: String(profileData.id),
      code: error && typeof error === 'object' && 'code' in error ? error.code : 'UNKNOWN_ERROR',
    });
    return NextResponse.json(
      { error: 'Le scan ne peut pas être confirmé, car son enregistrement dans le journal RH a échoué.' },
      {
        status: 503,
        headers: {
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'no-store, max-age=0',
        },
      },
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
  const whitelist: RHPublicWhitelist = normalizeRHPublicWhitelist(profileData.public_whitelist);

  const publicData: Record<string, any> = {
    status: 'valide',
    verifiedAt: new Date().toISOString(),
    institution: 'Institut National de la Poste, des Technologies de l’Information et de la Communication (INPTIC Gabon)',
  };

  if (whitelist.photo) publicData.photoUrl = profileData.photo_url || '';
  if (whitelist.matricule) publicData.matricule = profileData.matricule;
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
