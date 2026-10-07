import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Base PostgreSQL indisponible.' }, { status: 503 });
  }

  try {
    const { rows } = await getPostgresPool().query(
      `SELECT id, nom, prenom, filiere, poste, entreprise, promotion,
              commentaire, photo_url, created_at
       FROM public.alumni ORDER BY created_at DESC`,
    );
    return NextResponse.json({
      data: rows.map((row) => ({
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
      })),
    });
  } catch (error) {
    console.error('[Alumni GET] PostgreSQL error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de charger les anciens étudiants.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Base PostgreSQL indisponible.' }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const nom = typeof body?.nom === 'string' ? body.nom.trim() : '';
  const prenom = typeof body?.prenom === 'string' ? body.prenom.trim() : '';
  if (!nom || !prenom) {
    return NextResponse.json({ error: 'Nom et prénom requis' }, { status: 400 });
  }

  const promotion = Number.parseInt(String(body.promotion ?? ''), 10) || new Date().getFullYear();
  const photo = typeof body.photo === 'string' && body.photo.length ? body.photo : null;

  try {
    const { rows } = await getPostgresPool().query(
      `INSERT INTO public.alumni
         (nom, prenom, filiere, poste, entreprise, promotion, commentaire, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, nom, prenom, filiere, poste, entreprise, promotion,
                 commentaire, photo_url, created_at`,
      [
        nom,
        prenom,
        typeof body.filiere === 'string' ? body.filiere.trim() : '',
        typeof body.poste === 'string' ? body.poste.trim() : '',
        typeof body.entreprise === 'string' ? body.entreprise.trim() : '',
        promotion,
        typeof body.commentaire === 'string' ? body.commentaire.trim() : '',
        photo,
      ],
    );
    const row = rows[0];
    return NextResponse.json({
      data: {
        id: row.id,
        nom: row.nom,
        prenom: row.prenom,
        filiere: row.filiere,
        poste: row.poste,
        entreprise: row.entreprise,
        promotion: String(row.promotion),
        commentaire: row.commentaire,
        photo: row.photo_url || '',
        createdAt: row.created_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Alumni POST] PostgreSQL error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible d’enregistrer cet ancien étudiant.' }, { status: 503 });
  }
}
