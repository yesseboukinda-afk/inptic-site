import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = supabaseAdmin || supabase;
    if (!client) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await client
      .from('alumni')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Alumni GET] Supabase error:', error.message);
      return NextResponse.json({ data: [] });
    }

    const formatted = (data || []).map((row: any) => ({
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
    }));

    return NextResponse.json({ data: formatted });
  } catch (err) {
    console.error('[Alumni GET] Unexpected error:', err);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nom, prenom, filiere, poste, entreprise, promotion, commentaire, photo } = body;

    if (!nom || !prenom) {
      return NextResponse.json({ error: 'Nom et prénom requis' }, { status: 400 });
    }

    const client = supabaseAdmin || supabase;
    if (!client) {
      return NextResponse.json({
        data: {
          id: String(Date.now()),
          nom,
          prenom,
          filiere,
          poste,
          entreprise,
          promotion: String(promotion || ''),
          commentaire: commentaire || '',
          photo: photo || '',
          createdAt: new Date().toISOString(),
        },
      });
    }

    const row = {
      nom: String(nom).trim(),
      prenom: String(prenom).trim(),
      filiere: String(filiere || '').trim(),
      poste: String(poste || '').trim(),
      entreprise: String(entreprise || '').trim(),
      promotion: parseInt(String(promotion), 10) || new Date().getFullYear(),
      commentaire: String(commentaire || '').trim(),
      photo_url: typeof photo === 'string' && photo.length > 0 ? photo : null,
    };

    const { data, error } = await client
      .from('alumni')
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error('[Alumni POST] Supabase insert error:', error.message);
      // Fallback return the submitted data so client isn't blocked
      return NextResponse.json({
        data: {
          id: String(Date.now()),
          ...row,
          promotion: String(row.promotion),
          photo: row.photo_url || '',
          createdAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      data: {
        id: data.id,
        nom: data.nom,
        prenom: data.prenom,
        filiere: data.filiere,
        poste: data.poste,
        entreprise: data.entreprise,
        promotion: String(data.promotion),
        commentaire: data.commentaire,
        photo: data.photo_url || '',
        createdAt: data.created_at,
      },
    });
  } catch (err) {
    console.error('[Alumni POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
