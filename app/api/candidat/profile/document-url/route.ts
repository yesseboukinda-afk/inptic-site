import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getProfileDocumentPrefix } from '@/lib/documentStorage';

const DOCUMENT_BUCKET = 'dossier_documents';
const SIGNED_URL_TTL_SECONDS = 10 * 60;

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Le stockage sécurisé des documents n’est pas configuré.' }, { status: 503 });
  }

  let body: { email?: unknown; path?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  if (typeof body.email !== 'string' || typeof body.path !== 'string') {
    return NextResponse.json({ error: 'Adresse courriel et chemin de document requis.' }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const path = body.path;
  const expectedPrefix = getProfileDocumentPrefix(email);
  if (!email || !path.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: 'Chemin de document invalide.' }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('documents')
    .eq('email', email)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: 'Impossible de vérifier le document du candidat.' }, { status: 500 });
  }

  const documents = Array.isArray(profile?.documents) ? profile.documents : [];
  if (!documents.some((document: { path?: string }) => document?.path === path)) {
    return NextResponse.json({ error: 'Document introuvable pour ce candidat.' }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Impossible de générer le lien privé du document.' }, { status: 502 });
  }

  return NextResponse.json({ url: data.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS });
}
