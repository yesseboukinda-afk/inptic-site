import { NextRequest, NextResponse } from 'next/server';
import { isDirectorRole, normalizeRole } from '@/lib/roles';
import { strapi } from '@/lib/strapi';
import { supabaseAdmin } from '@/lib/supabase';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337/api').replace(/\/$/, '');

async function authorizeCommunication(request: NextRequest) {
  const accessToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken || !supabaseAdmin) {
    return { error: NextResponse.json({ error: 'Connexion responsable communication requise.' }, { status: 401 }) };
  }

  if (!process.env.STRAPI_API_TOKEN) {
    return { error: NextResponse.json({ error: 'Le jeton serveur STRAPI_API_TOKEN doit être configuré.' }, { status: 503 }) };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    return { error: NextResponse.json({ error: 'Session expirée. Reconnectez-vous.' }, { status: 401 }) };
  }

  const role = normalizeRole(data.user.app_metadata?.role ?? data.user.app_metadata?.roles);
  const directorEmail = (data.user.email || '').trim().toLowerCase().replace(/,/g, '.');
  const isConfiguredDirector = directorEmail === 'directeur@inptic.ga';
  if (role !== 'communication' && !isDirectorRole(role) && !isConfiguredDirector) {
    return { error: NextResponse.json({ error: 'Accès réservé au directeur général ou au responsable communication.' }, { status: 403 }) };
  }

  return { user: data.user };
}

async function strapiManagementRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${STRAPI_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
      ...init.headers,
    },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

function parsePublication(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const entry = value as Record<string, unknown>;
  const attributes = entry.attributes && typeof entry.attributes === 'object'
    ? entry.attributes as Record<string, unknown>
    : entry;
  const id = entry.documentId ?? entry.id;
  if (typeof id !== 'string' && typeof id !== 'number') return null;

  return {
    id: String(id),
    title: String(attributes.title || attributes.titre || ''),
    slug: String(attributes.slug || ''),
    excerpt: String(attributes.excerpt || attributes.description || attributes.resume || ''),
    category: String(attributes.category || 'Annonce'),
    publishedAt: typeof attributes.publishedAt === 'string' ? attributes.publishedAt : null,
    createdAt: typeof attributes.createdAt === 'string' ? attributes.createdAt : null,
  };
}

function createSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function validatePublication(body: unknown) {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const excerpt = typeof value.excerpt === 'string' ? value.excerpt.trim() : '';
  const category = typeof value.category === 'string' ? value.category.trim() : '';
  const status = value.status === 'published' ? 'published' : 'draft';
  if (!title || !excerpt || !category) return null;
  return { title, excerpt, category, slug: createSlug(title), status };
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('manage') === '1') {
    const authorization = await authorizeCommunication(request);
    if (authorization.error) return authorization.error;
    const [draftsResult, publishedResult] = await Promise.all([
      strapiManagementRequest('/actualites?populate=*&sort=updatedAt:desc&status=draft'),
      strapiManagementRequest('/actualites?populate=*&sort=updatedAt:desc&status=published'),
    ]);
    const failedResult = [draftsResult, publishedResult].find(({ response }) => !response.ok);
    if (failedResult) {
      return NextResponse.json({ error: `Chargement Strapi impossible (HTTP ${failedResult.response.status}).` }, { status: 502 });
    }

    const drafts = Array.isArray(draftsResult.payload.data) ? draftsResult.payload.data : [];
    const published = Array.isArray(publishedResult.payload.data) ? publishedResult.payload.data : [];
    const publishedById = new Map(published.map((entry: Record<string, unknown>) => [String(entry.documentId ?? entry.id), entry]));
    const entries = drafts.map((draft: Record<string, unknown>) => {
      const parsedDraft = parsePublication(draft);
      if (!parsedDraft) return null;
      const publishedEntry = publishedById.get(parsedDraft.id);
      const parsedPublished = publishedEntry ? parsePublication(publishedEntry) : null;
      return { ...parsedDraft, publishedAt: parsedPublished?.publishedAt ?? null };
    }).filter(Boolean);

    return NextResponse.json({ data: entries });
  }

  try {
    return NextResponse.json(await strapi('/actualites?populate=*&sort=publishedAt:desc'));
  } catch {
    return NextResponse.json({ error: 'API actualités indisponible.' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeCommunication(request);
  if (authorization.error) return authorization.error;

  const publication = validatePublication(await request.json().catch(() => null));
  if (!publication) {
    return NextResponse.json({ error: 'Titre, résumé et catégorie sont obligatoires.' }, { status: 400 });
  }

  const { status, ...publicationData } = publication;
  const statusQuery = status === 'draft' ? '?status=draft' : '';
  const { response, payload } = await strapiManagementRequest(`/actualites${statusQuery}`, {
    method: 'POST',
    body: JSON.stringify({ data: publicationData }),
  });
  if (!response.ok) {
    return NextResponse.json({ error: `Création Strapi refusée (HTTP ${response.status}). Vérifiez les droits du jeton et les champs de la collection.` }, { status: 502 });
  }

  return NextResponse.json({ data: parsePublication(payload.data) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const authorization = await authorizeCommunication(request);
  if (authorization.error) return authorization.error;

  const body = await request.json().catch(() => null) as { id?: unknown; publication?: unknown } | null;
  if (!body || (typeof body.id !== 'string' && typeof body.id !== 'number')) {
    return NextResponse.json({ error: 'Identifiant de publication requis.' }, { status: 400 });
  }
  const publication = validatePublication(body.publication);
  if (!publication) {
    return NextResponse.json({ error: 'Titre, résumé et catégorie sont obligatoires.' }, { status: 400 });
  }

  const { status, ...publicationData } = publication;
  const statusQuery = status === 'draft' ? '?status=draft' : '';
  const { response, payload } = await strapiManagementRequest(`/actualites/${encodeURIComponent(String(body.id))}${statusQuery}`, {
    method: 'PUT',
    body: JSON.stringify({ data: publicationData }),
  });
  if (!response.ok) {
    return NextResponse.json({ error: `Modification Strapi refusée (HTTP ${response.status}).` }, { status: 502 });
  }

  return NextResponse.json({ data: parsePublication(payload.data) });
}
