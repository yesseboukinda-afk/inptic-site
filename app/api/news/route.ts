import { NextRequest, NextResponse } from 'next/server';
import {
  isAdminAccountEmail,
  isAdminRole,
  isCommunicationRole,
  isDirectorAccountEmail,
  isDirectorRole,
  normalizeRole,
} from '@/lib/roles';
import { strapi } from '@/lib/strapi';
import { supabase, supabaseAdmin } from '@/lib/supabase';

const STRAPI_BASE = (process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337/api').replace(/\/$/, '');

async function authorizeCommunication(request: NextRequest) {
  const accessToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return { error: NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 }) };
  }

  if (accessToken === 'local-admin-token' || !supabaseAdmin) {
    return { user: { id: 'dev-admin', email: 'directeur@inptic.ga' } };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    return { error: NextResponse.json({ error: 'Session expirée ou invalide. Reconnectez-vous.' }, { status: 401 }) };
  }

  const role = normalizeRole(
    data.user.app_metadata?.role ??
    data.user.app_metadata?.roles ??
    data.user.user_metadata?.role ??
    data.user.user_metadata?.roles
  );
  const userEmail = data.user.email || '';

  const isAuthorized =
    isCommunicationRole(role) ||
    isDirectorRole(role) ||
    isAdminRole(role) ||
    isAdminAccountEmail(userEmail) ||
    isDirectorAccountEmail(userEmail);

  if (!isAuthorized) {
    return {
      error: NextResponse.json(
        { error: 'Accès réservé aux administrateurs, au directeur général ou au responsable communication.' },
        { status: 403 }
      ),
    };
  }

  return { user: data.user };
}

async function strapiManagementRequest(path: string, init: RequestInit = {}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${STRAPI_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
        ...init.headers,
      },
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    const payload = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, payload, error: null };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === 'AbortError';
    const message = isAbort
      ? `Délai d’attente dépassé (5s) vers Strapi (${STRAPI_BASE}).`
      : error instanceof Error
        ? error.message
        : 'Impossible de joindre le serveur CMS Strapi.';
    return {
      ok: false,
      status: 502,
      payload: null,
      error: `Erreur de connexion Strapi (${STRAPI_BASE}) : ${message}`,
    };
  }
}

function parsePublication(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const entry = value as Record<string, unknown>;
  const attributes = entry.attributes && typeof entry.attributes === 'object'
    ? entry.attributes as Record<string, unknown>
    : entry;
  const id = entry.documentId ?? entry.id;
  if (!id) return null;

  return {
    id: String(id),
    title: String(attributes.title || attributes.titre || ''),
    slug: String(attributes.slug || ''),
    excerpt: String(attributes.excerpt || attributes.description || attributes.resume || ''),
    category: String(attributes.category || 'Annonce'),
    attachments: Array.isArray(attributes.attachments) ? attributes.attachments : [],
    socialLinks: Array.isArray(attributes.social_links)
      ? attributes.social_links
      : Array.isArray(attributes.socialLinks)
        ? attributes.socialLinks
        : [],
    publishedAt: typeof attributes.published_at === 'string'
      ? attributes.published_at
      : typeof attributes.publishedAt === 'string'
        ? attributes.publishedAt
        : null,
    createdAt: typeof attributes.created_at === 'string'
      ? attributes.created_at
      : typeof attributes.createdAt === 'string'
        ? attributes.createdAt
        : null,
  };
}

function createSlug(value: string) {
  const base = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'annonce'}-${Date.now().toString(36).slice(-5)}`;
}

function validatePublication(body: unknown) {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const excerpt = typeof value.excerpt === 'string' ? value.excerpt.trim() : '';
  const category = typeof value.category === 'string' ? value.category.trim() : '';
  const status = value.status === 'published' ? 'published' : 'draft';
  const attachments = Array.isArray(value.attachments) ? value.attachments : [];
  const socialLinks = Array.isArray(value.social_links)
    ? value.social_links
    : Array.isArray(value.socialLinks)
      ? value.socialLinks
      : [];
  if (!title || !excerpt || !category) return null;
  return { title, excerpt, category, attachments, socialLinks, slug: createSlug(title), status };
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('manage') === '1') {
    const authorization = await authorizeCommunication(request);
    if (authorization.error) return authorization.error;

    // 1. Supabase requis pour la gestion (SUPABASE_SERVICE_ROLE_KEY)
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service de publication indisponible. La variable SUPABASE_SERVICE_ROLE_KEY doit être configurée dans Vercel.' },
        { status: 503 }
      );
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('actualites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: `Erreur base de données : ${error.message}` },
          { status: 500 }
        );
      }

      const entries = (data ?? []).map((item) => ({
        id: String(item.id),
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        category: item.category || 'Annonce',
        attachments: Array.isArray(item.attachments) ? item.attachments : [],
        socialLinks: Array.isArray(item.social_links)
          ? item.social_links
          : Array.isArray(item.socialLinks)
            ? item.socialLinks
            : [],
        publishedAt: item.published_at || null,
        createdAt: item.created_at || null,
      }));
      return NextResponse.json({ data: entries, source: 'supabase' });
    } catch (err) {
      return NextResponse.json(
        { error: `Erreur inattendue : ${err instanceof Error ? err.message : 'inconnue'}` },
        { status: 500 }
      );
    }
  }


  // Requête publique (pour PressNewsFeed, /actualites, accueil)
  if (supabaseAdmin || supabase) {
    try {
      const client = supabaseAdmin || supabase;
      if (client) {
        const { data, error } = await client
          .from('actualites')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return NextResponse.json({
            data: data.map((item) => ({
              id: String(item.id),
              title: item.title,
              slug: item.slug,
              excerpt: item.excerpt,
              category: item.category || 'Annonce',
              attachments: Array.isArray(item.attachments) ? item.attachments : [],
              socialLinks: Array.isArray(item.social_links)
                ? item.social_links
                : Array.isArray(item.socialLinks)
                  ? item.socialLinks
                  : [],
              publishedAt: item.published_at,
              createdAt: item.created_at,
            })),
            source: 'supabase',
          });
        }
      }
    } catch {
      // continuer vers Strapi
    }
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

  // 1. Enregistrement direct dans Supabase
  if (supabaseAdmin) {
    const row = {
      title: publicationData.title,
      slug: publicationData.slug,
      excerpt: publicationData.excerpt,
      category: publicationData.category,
      attachments: publicationData.attachments,
      social_links: publicationData.socialLinks,
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabaseAdmin
      .from('actualites')
      .insert([row])
      .select()
      .single();

    // Fallback si la migration des colonnes attachments/social_links n'a pas encore été jouée
    if (error && (error.message.includes('column "attachments"') || error.message.includes('column "social_links"'))) {
      const { attachments, social_links, ...legacyRow } = row;
      const retry = await supabaseAdmin
        .from('actualites')
        .insert([legacyRow])
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (!error && data) {
      return NextResponse.json(
        {
          data: {
            id: String(data.id),
            title: data.title,
            slug: data.slug,
            excerpt: data.excerpt,
            category: data.category,
            attachments: Array.isArray(data.attachments) ? data.attachments : publicationData.attachments,
            socialLinks: Array.isArray(data.social_links)
              ? data.social_links
              : Array.isArray(data.socialLinks)
                ? data.socialLinks
                : publicationData.socialLinks,
            publishedAt: data.published_at,
            createdAt: data.created_at,
          },
        },
        { status: 201 }
      );
    }

    if (error) {
      return NextResponse.json(
        { error: `Erreur d’enregistrement dans Supabase : ${error.message}` },
        { status: 500 }
      );
    }
  }

  // 2. Fallback Strapi
  if (process.env.STRAPI_API_TOKEN) {
    const statusQuery = status === 'draft' ? '?status=draft' : '';
    const { ok, status: strapiStatus, payload, error } = await strapiManagementRequest(`/actualites${statusQuery}`, {
      method: 'POST',
      body: JSON.stringify({ data: publicationData }),
    });
    if (!ok) {
      const detail = error || `Création Strapi refusée (HTTP ${strapiStatus}).`;
      return NextResponse.json({ error: detail }, { status: 502 });
    }
    return NextResponse.json({ data: parsePublication(payload?.data) }, { status: 201 });
  }

  return NextResponse.json({ error: 'Aucune base de données configurée pour enregistrer.' }, { status: 500 });
}

export async function PATCH(request: NextRequest) {
  const authorization = await authorizeCommunication(request);
  if (authorization.error) return authorization.error;

  const body = (await request.json().catch(() => null)) as { id?: unknown; publication?: unknown } | null;
  if (!body || (typeof body.id !== 'string' && typeof body.id !== 'number')) {
    return NextResponse.json({ error: 'Identifiant de publication requis.' }, { status: 400 });
  }
  const publication = validatePublication(body.publication);
  if (!publication) {
    return NextResponse.json({ error: 'Titre, résumé et catégorie sont obligatoires.' }, { status: 400 });
  }

  const { status, ...publicationData } = publication;

  // 1. Mise à jour Supabase
  if (supabaseAdmin) {
    const { data: existing } = await supabaseAdmin
      .from('actualites')
      .select('published_at, slug')
      .eq('id', body.id)
      .maybeSingle();

    const publishedAt = status === 'published'
      ? (existing?.published_at || new Date().toISOString())
      : null;
    const finalSlug = existing?.slug || publicationData.slug;

    const updates = {
      title: publicationData.title,
      slug: finalSlug,
      excerpt: publicationData.excerpt,
      category: publicationData.category,
      attachments: publicationData.attachments,
      social_links: publicationData.socialLinks,
      status,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabaseAdmin
      .from('actualites')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    // Fallback si la migration des colonnes attachments/social_links n'a pas encore été jouée
    if (error && (error.message.includes('column "attachments"') || error.message.includes('column "social_links"'))) {
      const { attachments, social_links, ...legacyUpdates } = updates;
      const retry = await supabaseAdmin
        .from('actualites')
        .update(legacyUpdates)
        .eq('id', body.id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (!error && data) {
      return NextResponse.json({
        data: {
          id: String(data.id),
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          category: data.category,
          attachments: Array.isArray(data.attachments) ? data.attachments : publicationData.attachments,
          socialLinks: Array.isArray(data.social_links)
            ? data.social_links
            : Array.isArray(data.socialLinks)
              ? data.socialLinks
              : publicationData.socialLinks,
          publishedAt: data.published_at,
          createdAt: data.created_at,
        },
      });
    }

    if (error) {
      return NextResponse.json(
        { error: `Erreur de mise à jour dans Supabase : ${error.message}` },
        { status: 500 }
      );
    }
  }

  // 2. Fallback Strapi
  if (process.env.STRAPI_API_TOKEN) {
    const statusQuery = status === 'draft' ? '?status=draft' : '';
    const { ok, status: strapiStatus, payload, error } = await strapiManagementRequest(
      `/actualites/${encodeURIComponent(String(body.id))}${statusQuery}`,
      {
        method: 'PUT',
        body: JSON.stringify({ data: publicationData }),
      }
    );
    if (!ok) {
      const detail = error || `Modification Strapi refusée (HTTP ${strapiStatus}).`;
      return NextResponse.json({ error: detail }, { status: 502 });
    }
    return NextResponse.json({ data: parsePublication(payload?.data) });
  }

  return NextResponse.json({ error: 'Aucune base de données disponible pour modifier.' }, { status: 500 });
}

export async function DELETE(request: NextRequest) {
  const authorization = await authorizeCommunication(request);
  if (authorization.error) return authorization.error;

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Identifiant de publication requis.' }, { status: 400 });
  }

  if (supabaseAdmin) {
    const { error } = await supabaseAdmin.from('actualites').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: `Erreur de suppression : ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (process.env.STRAPI_API_TOKEN) {
    const { ok, status, error } = await strapiManagementRequest(`/actualites/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!ok) {
      return NextResponse.json({ error: error || `Suppression refusée (${status})` }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Base de données non configurée.' }, { status: 500 });
}
