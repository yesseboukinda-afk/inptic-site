import { NextRequest, NextResponse } from 'next/server';
import { authorizeStaffRequest } from '@/lib/staff-storage';
import { getPostgresPool } from '@/lib/postgres';
import { deleteStoredFile, getPublicStorageUrl } from '@/lib/localStorage';

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
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Base PostgreSQL indisponible.' }, { status: 503 });
  const manage = request.nextUrl.searchParams.get('manage') === '1';
  if (manage) {
    const auth = await authorizeStaffRequest(request, 'Accès réservé à l’administration des formations.');
    if (auth.error) return auth.error;
  }

  try {
    const { rows } = await getPostgresPool().query(
      `SELECT * FROM public.training_catalog
       ${manage ? '' : "WHERE status = 'published'"}
       ORDER BY created_at DESC`,
    );
    return NextResponse.json({ data: rows.map((row) => normalizeRow(row as Record<string, unknown>)) });
  } catch (error) {
    console.error('Erreur PostgreSQL dans le catalogue des formations:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Catalogue indisponible. Vérifiez la migration SQL.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'Accès réservé à l’administration des formations.');
  if (auth.error) return auth.error;
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'PostgreSQL indisponible.' }, { status: 503 });

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const kind = body?.kind as ResourceKind;
  const path = typeof body?.path === 'string' ? body.path.trim() : '';
  if (!title || title.length > 160 || !RESOURCE_KINDS.includes(kind) || !isValidResourcePath(path, kind)) {
    return NextResponse.json({ error: 'Titre ou ressource invalide.' }, { status: 400 });
  }

  const url = getPublicStorageUrl('formations-catalogue', path);
  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE public.training_catalog SET status = 'draft', updated_at = NOW()
       WHERE kind = $1 AND status = 'published'`,
      [kind],
    );
    const { rows } = await client.query(
      `INSERT INTO public.training_catalog (title, kind, resource_url, storage_path, status)
       VALUES ($1, $2, $3, $4, 'published') RETURNING *`,
      [title, kind, url, path],
    );
    await client.query('COMMIT');
    return NextResponse.json({ data: normalizeRow(rows[0] as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur PostgreSQL lors de la publication du catalogue:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Publication du catalogue impossible.' }, { status: 503 });
  } finally {
    client.release();
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'Accès réservé à l’administration des formations.');
  if (auth.error) return auth.error;
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'PostgreSQL indisponible.' }, { status: 503 });

  const body = await request.json().catch(() => null);
  if (typeof body?.id !== 'string' || !['published', 'draft'].includes(body.status)) {
    return NextResponse.json({ error: 'Ressource ou statut invalide.' }, { status: 400 });
  }
  if (body.status === 'published') {
    const { rows: resourceRows } = await getPostgresPool().query(
      'SELECT kind FROM public.training_catalog WHERE id::text = $1',
      [body.id],
    );
    const resource = resourceRows[0];
    if (!resource) return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 });
    await getPostgresPool().query(
      `UPDATE public.training_catalog SET status = 'draft', updated_at = NOW()
       WHERE kind = $1 AND status = 'published' AND id::text <> $2`,
      [resource.kind, body.id],
    );
  }

  try {
    const { rowCount } = await getPostgresPool().query(
      `UPDATE public.training_catalog SET status = $1, updated_at = NOW()
       WHERE id::text = $2`,
      [body.status, body.id],
    );
    if (!rowCount) return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur PostgreSQL lors de la mise à jour du catalogue:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Mise à jour impossible.' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'Accès réservé à l’administration des formations.');
  if (auth.error) return auth.error;
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'PostgreSQL indisponible.' }, { status: 503 });

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Identifiant requis.' }, { status: 400 });

  try {
    const { rows } = await getPostgresPool().query(
      'DELETE FROM public.training_catalog WHERE id::text = $1 RETURNING storage_path',
      [id],
    );
    if (!rows[0]) return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 });
    if (rows[0].storage_path) {
      await deleteStoredFile('formations-catalogue', rows[0].storage_path);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur PostgreSQL lors de la suppression du catalogue:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Suppression impossible.' }, { status: 503 });
  }
}