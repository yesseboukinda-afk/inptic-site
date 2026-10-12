import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AlumniInput = {
  nom: string;
  prenom: string;
  filiere: string;
  poste: string;
  entreprise: string;
  promotion: number;
  commentaire: string;
  photo: string | null;
};

type AlumniRow = {
  id: string;
  nom: string;
  prenom: string;
  filiere: string;
  poste: string;
  entreprise: string;
  promotion: number;
  commentaire: string;
  photo_url: string | null;
  owner_user_id: string | null;
  created_at: string;
};

function parseAlumniInput(body: unknown): AlumniInput | null {
  if (!body || typeof body !== 'object') return null;
  const fields = body as Record<string, unknown>;
  const nom = typeof fields.nom === 'string' ? fields.nom.trim() : '';
  const prenom = typeof fields.prenom === 'string' ? fields.prenom.trim() : '';
  const filiere = typeof fields.filiere === 'string' ? fields.filiere.trim() : '';
  const poste = typeof fields.poste === 'string' ? fields.poste.trim() : '';
  const entreprise = typeof fields.entreprise === 'string' ? fields.entreprise.trim() : '';
  const commentaire = typeof fields.commentaire === 'string' ? fields.commentaire.trim() : '';
  const promotion = Number(fields.promotion);
  const photo = typeof fields.photo === 'string' && fields.photo.length > 0 ? fields.photo : null;

  if (
    !nom || nom.length > 100 ||
    !prenom || prenom.length > 100 ||
    filiere.length > 120 ||
    poste.length > 160 ||
    entreprise.length > 160 ||
    commentaire.length > 500 ||
    !Number.isInteger(promotion) || promotion < 1900 || promotion > new Date().getFullYear() + 10 ||
    (photo !== null && photo.length > 7_000_000)
  ) {
    return null;
  }

  return { nom, prenom, filiere, poste, entreprise, promotion, commentaire, photo };
}

function serializeAlumni(row: AlumniRow, currentUserId: string | null) {
  return {
    id: row.id,
    nom: row.nom || '',
    prenom: row.prenom || '',
    filiere: row.filiere || '',
    poste: row.poste || '',
    entreprise: row.entreprise || '',
    promotion: String(row.promotion || ''),
    commentaire: row.commentaire || '',
    photo: row.photo_url || '',
    createdAt: row.created_at,
    isOwner: currentUserId !== null && row.owner_user_id === currentUserId,
  };
}

function logPostgresError(action: string, error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
    ? error.code
    : 'UNKNOWN';
  console.error(`[Alumni ${action}] PostgreSQL error:`, {
    code,
    message: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
  });
  return code;
}

function unavailable(error: string, status = 503) {
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return unavailable('Base PostgreSQL indisponible.');
  }

  try {
    const user = await getAuthenticatedUser(request);
    const { rows } = await getPostgresPool().query<AlumniRow>(
      `SELECT id, nom, prenom, filiere, poste, entreprise, promotion,
              commentaire, photo_url, owner_user_id, created_at
       FROM public.alumni ORDER BY created_at DESC`,
    );
    return NextResponse.json({
      data: rows.map((row) => serializeAlumni(row, user?.id ?? null)),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = logPostgresError('GET', error);
    if (code === '42P01' || code === '42703') {
      return unavailable(`Le schéma Alumni doit être mis à jour (PostgreSQL ${code}). Exécutez scripts/16_alumni_verified_ownership.sql.`, 503);
    }
    return unavailable('Impossible de charger les anciens étudiants.');
  }
}

async function siteAuditedPOST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return unavailable('Base PostgreSQL indisponible.');
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unavailable('Connectez-vous avec une adresse e-mail vérifiée pour créer votre profil Alumni.', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return unavailable('Requête invalide.', 400);
  }

  const input = parseAlumniInput(body);
  if (!input) {
    return unavailable('Vérifiez les champs du profil : nom, prénom, promotion et longueurs maximales requis.', 400);
  }

  try {
    const { rows } = await getPostgresPool().query<AlumniRow>(
      `INSERT INTO public.alumni
         (nom, prenom, filiere, poste, entreprise, promotion, commentaire, photo_url, owner_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, nom, prenom, filiere, poste, entreprise, promotion,
                 commentaire, photo_url, owner_user_id, created_at`,
      [
        input.nom,
        input.prenom,
        input.filiere,
        input.poste,
        input.entreprise,
        input.promotion,
        input.commentaire,
        input.photo,
        user.id,
      ],
    );
    return NextResponse.json({
      data: serializeAlumni(rows[0], user.id),
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = logPostgresError('POST', error);
    if (code === '23505') {
      return unavailable('Un profil Alumni est déjà associé à ce compte.', 409);
    }
    if (code === '42P01' || code === '42703') {
      return unavailable(`Le schéma Alumni doit être mis à jour (PostgreSQL ${code}). Exécutez scripts/16_alumni_verified_ownership.sql.`, 503);
    }
    return unavailable('Impossible d’enregistrer cet ancien étudiant.');
  }
}

async function siteAuditedPUT(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return unavailable('Base PostgreSQL indisponible.');
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unavailable('Connectez-vous avec une adresse e-mail vérifiée pour modifier votre profil Alumni.', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return unavailable('Requête invalide.', 400);
  }

  const input = parseAlumniInput(body);
  if (!input) {
    return unavailable('Vérifiez les champs du profil : nom, prénom, promotion et longueurs maximales requis.', 400);
  }

  try {
    const { rows } = await getPostgresPool().query<AlumniRow>(
      `UPDATE public.alumni
       SET nom = $1, prenom = $2, filiere = $3, poste = $4,
           entreprise = $5, promotion = $6, commentaire = $7, photo_url = $8
       WHERE owner_user_id = $9
       RETURNING id, nom, prenom, filiere, poste, entreprise, promotion,
                 commentaire, photo_url, owner_user_id, created_at`,
      [
        input.nom,
        input.prenom,
        input.filiere,
        input.poste,
        input.entreprise,
        input.promotion,
        input.commentaire,
        input.photo,
        user.id,
      ],
    );
    if (!rows[0]) {
      return unavailable('Aucun profil Alumni associé à ce compte.', 404);
    }
    return NextResponse.json({
      data: serializeAlumni(rows[0], user.id),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = logPostgresError('PUT', error);
    if (code === '42P01' || code === '42703') {
      return unavailable(`Le schéma Alumni doit être mis à jour (PostgreSQL ${code}). Exécutez scripts/16_alumni_verified_ownership.sql.`, 503);
    }
    return unavailable('Impossible de mettre à jour le profil Alumni.');
  }
}

export const POST = withSiteAudit("Création de profil Alumni", siteAuditedPOST);
export const PUT = withSiteAudit("Modification de profil Alumni", siteAuditedPUT);
