import { NextRequest, NextResponse } from 'next/server';
import { authorizeStaffRequest } from '@/lib/staff-storage';
import { supabaseAdmin } from '@/lib/supabase';

const RESOURCE_KINDS = ['pdf', 'video'] as const;
type ResourceKind = (typeof RESOURCE_KINDS)[number];

function isValidResourcePath(value: string, kind: ResourceKind) {
  const [folder, filename, ...extra] = value.split('/');
  const validExtension = kind === 'pdf' ? /\.pdf$/i : /\.(mp4|webm)$/i;
  return folder === 'catalogue' && Boolean(filename) && extra.length === 0 && /^[\w.-]+$/.test(filename) && validExtension.test(filename);
}

function normalizeRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: String(row.title || ''),
    kind: row.kind === 'video' ? 'video' : 'pdf',
    url: String(row.resource_url || ''),
    path: typeof row.storage_path === 'string' ? row.storage_path : null,
    status: row.status === 'draft' ? 'draft' : 'published',
    createdAt: String(row.created_at || ''),
  };
}

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ data: [] });
  const manage = request.nextUrl.searchParams.get('manage') === '1';
  if (manage) {
    const auth = await authorizeStaffRequest(request, 'Accès réservé à l’administration des formations.');
    if (auth.error) return auth.error;
  }

  let query = supabaseAdmin
    .from('training_catalog')
    .select('*')
    .order('created_at', { ascending: false });
  if (!manage) query = query.eq('status', 'published');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Catalogue indisponible. Vérifiez la migration SQL.' }, { status: 503 });
  return NextResponse.json({ data: (data || []).map((row) => normalizeRow(row as Record<string, unknown>)) });
}

export async function POST(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'Accès réservé à l’administration des formations.');
  if (auth.error) return auth.error;
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase serveur indisponible.' }, { status: 503 });

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const kind = body?.kind as ResourceKind;
  const path = typeof body?.path === 'string' ? body.path.trim() : '';
  if (!title || title.length > 160 || !RESOURCE_KINDS.includes(kind) || !isValidResourcePath(path, kind)) {
    return NextResponse.json({ error: 'Titre ou ressource invalide.' }, { status: 400 });
  }

  const { data: publicFile } = supabaseAdmin.storage.from('formations-catalogue').getPublicUrl(path);
  const url = publicFile.publicUrl;

  const { error: archiveError } = await supabaseAdmin
    .from('training_catalog')
    .update({ status: 'draft', updated_at: new Date().toISOString() })
    .eq('kind', kind)
    .eq('status', 'published');
  if (archiveError) return NextResponse.json({ error: 'Remplacement de la ressource publiée impossible.' }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from('training_catalog')
    .insert({ title, kind, resource_url: url, storage_path: path, status: 'published' })
    .select('*')
    .single();
  if (error || !data) return NextResponse.json({ error: 'Publication du catalogue impossible.' }, { status: 500 });
  return NextResponse.json({ data: normalizeRow(data as Record<string, unknown>) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'Accès réservé à l’administration des formations.');
  if (auth.error) return auth.error;
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase serveur indisponible.' }, { status: 503 });

  const body = await request.json().catch(() => null);
  if (typeof body?.id !== 'string' || !['published', 'draft'].includes(body.status)) {
    return NextResponse.json({ error: 'Ressource ou statut invalide.' }, { status: 400 });
  }
  if (body.status === 'published') {
    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('training_catalog')
      .select('kind')
      .eq('id', body.id)
      .maybeSingle();
    if (resourceError || !resource) return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 });

    const { error: archiveError } = await supabaseAdmin
      .from('training_catalog')
      .update({ status: 'draft', updated_at: new Date().toISOString() })
      .eq('kind', resource.kind)
      .eq('status', 'published')
      .neq('id', body.id);
    if (archiveError) return NextResponse.json({ error: 'Remplacement de la ressource publiée impossible.' }, { status: 500 });
  }

  const { error } = await supabaseAdmin
    .from('training_catalog')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', body.id);
  if (error) return NextResponse.json({ error: 'Mise à jour impossible.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'Accès réservé à l’administration des formations.');
  if (auth.error) return auth.error;
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase serveur indisponible.' }, { status: 503 });

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Identifiant requis.' }, { status: 400 });

  const { data: resource, error: findError } = await supabaseAdmin
    .from('training_catalog')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();
  if (findError) return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 });
  if (resource?.storage_path) {
    await supabaseAdmin.storage.from('formations-catalogue').remove([resource.storage_path]);
  }
  const { error } = await supabaseAdmin.from('training_catalog').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Suppression impossible.' }, { status: 500 });
  return NextResponse.json({ success: true });
}