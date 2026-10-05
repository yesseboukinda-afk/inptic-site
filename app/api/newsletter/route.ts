import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const email = 'email' in body && typeof body.email === 'string'
    ? body.email.trim().toLowerCase()
    : '';

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Le service d’inscription à la newsletter est indisponible.' },
      { status: 503 },
    );
  }

  const { error } = await supabaseAdmin
    .from('subscribers')
    .upsert(
      { email, subscribed_at: new Date().toISOString(), is_active: true },
      { onConflict: 'email' },
    );

  if (error) {
    console.error('Erreur d’enregistrement d’une inscription newsletter:', error.code);
    return NextResponse.json(
      { error: 'Impossible d’enregistrer votre inscription pour le moment. Veuillez réessayer plus tard.' },
      { status: 503 },
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Votre adresse est bien enregistrée comme abonnée.',
  });
}
