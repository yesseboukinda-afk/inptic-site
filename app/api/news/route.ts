import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { canAccessStaffService } from '@/lib/roles';
import { strapi } from '@/lib/strapi';
import { getPostgresPool } from '@/lib/postgres';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { sendPublicationNewsletter } from '@/lib/newsletter';

// Utilise STRAPI_URL (privée) en priorité, NEXT_PUBLIC_STRAPI_URL seulement en fallback
const STRAPI_BASE = (process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337/api').replace(/\/$/, '');
type PublicationTarget = 'actualites' | 'annonces';
const DEFAULT_PUBLICATION_TARGETS: PublicationTarget[] = ['actualites', 'annonces'];

function normalizePublicationTargets(value: unknown): PublicationTarget[] {
  if (!Array.isArray(value)) return [...DEFAULT_PUBLICATION_TARGETS];
  return [...new Set(value.filter((target): target is PublicationTarget => target === 'actualites' || target === 'annonces'))];
}

async function authorizeCommunication(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 }) };
  }
  if (!canAccessStaffService(user.role, 'announcements', user.user_metadata.service ?? user.user_metadata.department)) {
    return {
      error: NextResponse.json(
        { error: 'Accès réservé aux administrateurs, au directeur général ou au responsable communication.' },
        { status: 403 }
      ),
    };
  }

  return { user };
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
    console.error('Erreur Strapi interne:', error instanceof Error ? error.message : error);
    return {
      ok: false,
      status: 502,
      payload: null,
      error: 'Impossible de joindre le serveur CMS.',
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
    targetPages: normalizePublicationTargets(attributes.target_pages ?? attributes.targetPages),
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

function isTechVeillePublication(publication: { title: string; excerpt: string }) {
  return /^\s*\[Veille IT\]/i.test(publication.title) ||
    /^\s*\[VEILLE IT\s*&\s*IA\s*-\s*INPTIC GABON\]/im.test(publication.excerpt);
}

function belongsToPublicTarget(
  publication: { title: string; excerpt: string; targetPages: PublicationTarget[] },
  target: PublicationTarget,
) {
  return publication.targetPages.includes(target) &&
    (target !== 'annonces' || !isTechVeillePublication(publication));
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
  const rawTargets = value.targetPages ?? value.target_pages;
  const hasTargets = rawTargets !== undefined;
  const targetPages = hasTargets ? normalizePublicationTargets(rawTargets) : undefined;
  if (hasTargets && (!Array.isArray(rawTargets) || !targetPages?.length)) return null;
  if (!title || !excerpt || !category) return null;
  return { title, excerpt, category, attachments, socialLinks, targetPages, slug: createSlug(title), status };
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('manage') === '1') {
    const authorization = await authorizeCommunication(request);
    if (authorization.error) return authorization.error;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Service de publication indisponible. Configurez PostgreSQL.' },
        { status: 503 }
      );
    }

    try {
      const { rows } = await getPostgresPool().query(
        `SELECT id, title, slug, excerpt, category, attachments, social_links,
                target_pages, published_at, created_at
         FROM public.actualites
         ORDER BY created_at DESC`,
      );
      const entries = rows.map((item) => ({
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
        targetPages: normalizePublicationTargets(item.target_pages ?? item.targetPages),
        publishedAt: item.published_at || null,
        createdAt: item.created_at || null,
      }));
      return NextResponse.json({ data: entries, source: 'postgres' });
    } catch (err) {
      console.error('Erreur PostgreSQL lors du chargement des actualités:', err instanceof Error ? err.message : 'UNKNOWN_ERROR');
      return NextResponse.json(
        { error: 'Impossible de charger les actualités depuis PostgreSQL.' },
        { status: 503 }
      );
    }
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'PostgreSQL n’est pas configuré.' }, { status: 503 });
  }
  const requestedTarget = request.nextUrl.searchParams.get('target');
  if (requestedTarget && requestedTarget !== 'actualites' && requestedTarget !== 'annonces') {
    return NextResponse.json({ error: 'Page cible invalide.' }, { status: 400 });
  }
  const targetPage = requestedTarget as PublicationTarget | null;



  if (process.env.DATABASE_URL) {
    try {
      const { rows } = targetPage
        ? await getPostgresPool().query(
          `SELECT id, title, slug, excerpt, category, attachments, social_links,
                    target_pages, published_at, created_at
             FROM public.actualites
             WHERE status = 'published' AND target_pages @> ARRAY[$1]::TEXT[]
             ORDER BY published_at DESC NULLS LAST`,
          [targetPage],
        )
        : await getPostgresPool().query(
          `SELECT id, title, slug, excerpt, category, attachments, social_links,
                    target_pages, published_at, created_at
             FROM public.actualites
             WHERE status = 'published'
             ORDER BY published_at DESC NULLS LAST`,
        );
      const entries = rows.map((item) => ({
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
        targetPages: normalizePublicationTargets(item.target_pages ?? item.targetPages),
        publishedAt: item.published_at,
        createdAt: item.created_at,
      }));
      return NextResponse.json({
        data: targetPage ? entries.filter((item) => belongsToPublicTarget(item, targetPage)) : entries,
        source: 'postgres',
      });
    } catch (error) {
      console.error('Erreur PostgreSQL lors du chargement public des actualités:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json({ error: 'API actualités indisponible.' }, { status: 503 });
    }
  }

  try {
    const payload = await strapi('/actualites?populate=*&sort=publishedAt:desc');
    if (!targetPage) return NextResponse.json(payload);
    const strapiPayload = payload as { data?: unknown } | null;
    const rawEntries = Array.isArray(strapiPayload?.data) ? strapiPayload.data : [];
    const entries = rawEntries
      .map(parsePublication)
      .filter((item): item is NonNullable<ReturnType<typeof parsePublication>> => item !== null && belongsToPublicTarget(item, targetPage));
    return NextResponse.json({ data: entries });
  } catch {
    return NextResponse.json({ error: 'API actualités indisponible.' }, { status: 502 });
  }
}

async function siteAuditedPOST(request: NextRequest) {
  const authorization = await authorizeCommunication(request);
  if (authorization.error) return authorization.error;
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'PostgreSQL n’est pas configuré.' }, { status: 503 });
  }

  const publication = validatePublication(await request.json().catch(() => null));
  if (!publication) {
    return NextResponse.json({ error: 'Titre, résumé et catégorie sont obligatoires.' }, { status: 400 });
  }

  const { status, ...publicationData } = publication;

  if (process.env.DATABASE_URL) {
    const row = {
      title: publicationData.title,
      slug: publicationData.slug,
      excerpt: publicationData.excerpt,
      category: publicationData.category,
      attachments: publicationData.attachments,
      social_links: publicationData.socialLinks,
      target_pages: publicationData.targetPages ?? DEFAULT_PUBLICATION_TARGETS,
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
    };

    try {
      const { rows } = await getPostgresPool().query(
        `INSERT INTO public.actualites
           (title, slug, excerpt, category, attachments, social_links,
            target_pages, status, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          row.title, row.slug, row.excerpt, row.category,
          JSON.stringify(row.attachments), JSON.stringify(row.social_links),
          row.target_pages, row.status, row.published_at,
        ],
      );
      const data = rows[0];
      const newsletter = status === 'published'
        ? await sendPublicationNewsletter({
          id: String(data.id),
          title: publicationData.title,
          excerpt: publicationData.excerpt,
          slug: String(data.slug || publicationData.slug),
          targetPages: normalizePublicationTargets(data.target_pages ?? publicationData.targetPages ?? DEFAULT_PUBLICATION_TARGETS),
          attachments: Array.isArray(data.attachments) ? data.attachments : publicationData.attachments,
        })
        : undefined;
      return NextResponse.json(
        {
          ...(newsletter ? { newsletter } : {}),
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
            targetPages: normalizePublicationTargets(data.target_pages ?? publicationData.targetPages),
            publishedAt: data.published_at,
            createdAt: data.created_at,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Erreur PostgreSQL lors de la création d’une actualité:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json(
        { error: 'Impossible d’enregistrer l’actualité dans PostgreSQL.' },
        { status: 503 }
      );
    }
  }

  // 2. Fallback Strapi
  if (process.env.STRAPI_API_TOKEN) {
    const statusQuery = `?status=${status}`;
    const { ok, status: strapiStatus, payload, error } = await strapiManagementRequest(`/actualites${statusQuery}`, {
      method: 'POST',
      body: JSON.stringify({ data: { ...publicationData, targetPages: publicationData.targetPages ?? DEFAULT_PUBLICATION_TARGETS } }),
    });
    if (!ok) {
      const detail = error || `Création Strapi refusée (HTTP ${strapiStatus}).`;
      return NextResponse.json({ error: detail }, { status: 502 });
    }
    const created = parsePublication(payload?.data);
    const newsletter = status === 'published' && created
      ? await sendPublicationNewsletter({
        id: created.id,
        title: created.title,
        excerpt: created.excerpt,
        slug: created.slug,
        targetPages: created.targetPages,
        attachments: created.attachments,
      })
      : undefined;
    return NextResponse.json({ data: created, ...(newsletter ? { newsletter } : {}) }, { status: 201 });
  }

  return NextResponse.json({ error: 'Aucune base de données configurée pour enregistrer.' }, { status: 500 });
}

async function siteAuditedPATCH(request: NextRequest) {
  const authorization = await authorizeCommunication(request);
  if (authorization.error) return authorization.error;
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'PostgreSQL n’est pas configuré.' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { id?: unknown; publication?: unknown } | null;
  if (!body || (typeof body.id !== 'string' && typeof body.id !== 'number')) {
    return NextResponse.json({ error: 'Identifiant de publication requis.' }, { status: 400 });
  }
  const publication = validatePublication(body.publication);
  if (!publication) {
    return NextResponse.json({ error: 'Titre, résumé et catégorie sont obligatoires.' }, { status: 400 });
  }

  const { status, ...publicationData } = publication;

  if (process.env.DATABASE_URL) {
    try {
      const pool = getPostgresPool();
      const { rows: existingRows } = await pool.query(
        'SELECT published_at, slug FROM public.actualites WHERE id::text = $1',
        [String(body.id)],
      );
      const existing = existingRows[0];
      if (!existing) return NextResponse.json({ error: 'Actualité introuvable.' }, { status: 404 });
      const publishedAt = status === 'published'
        ? (existing.published_at || new Date().toISOString())
        : null;
      const finalSlug = existing.slug || publicationData.slug;
      const { rows } = await pool.query(
        `UPDATE public.actualites
         SET title = $1, slug = $2, excerpt = $3, category = $4,
             attachments = $5, social_links = $6, target_pages = $7,
             status = $8, published_at = $9, updated_at = NOW()
         WHERE id::text = $10 RETURNING *`,
        [
          publicationData.title, finalSlug, publicationData.excerpt, publicationData.category,
          JSON.stringify(publicationData.attachments), JSON.stringify(publicationData.socialLinks),
          publicationData.targetPages ?? DEFAULT_PUBLICATION_TARGETS,
          status, publishedAt, String(body.id),
        ],
      );
      const data = rows[0];
      const newsletter = status === 'published' && !existing?.published_at
        ? await sendPublicationNewsletter({
          id: String(data.id),
          title: publicationData.title,
          excerpt: publicationData.excerpt,
          slug: String(data.slug || finalSlug),
          targetPages: normalizePublicationTargets(data.target_pages ?? publicationData.targetPages ?? DEFAULT_PUBLICATION_TARGETS),
          attachments: Array.isArray(data.attachments) ? data.attachments : publicationData.attachments,
        })
        : undefined;
      return NextResponse.json({
        ...(newsletter ? { newsletter } : {}),
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
          targetPages: normalizePublicationTargets(data.target_pages ?? publicationData.targetPages),
          publishedAt: data.published_at,
          createdAt: data.created_at,
        },
      });
    } catch (error) {
      console.error('Erreur PostgreSQL lors de la mise à jour d’une actualité:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json({ error: 'Impossible de mettre à jour l’actualité.' }, { status: 503 });
    }
  }

  // 2. Fallback Strapi
  if (process.env.STRAPI_API_TOKEN) {
    let shouldSendNewsletter = false;
    if (status === 'published') {
      const existing = await strapiManagementRequest(
        `/actualites/${encodeURIComponent(String(body.id))}?status=published`,
        { method: 'GET' },
      );
      if (existing.ok) {
        shouldSendNewsletter = !parsePublication(existing.payload?.data)?.publishedAt;
      } else if (existing.status === 404) {
        shouldSendNewsletter = true;
      }
    }

    const statusQuery = `?status=${status}`;
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
    const updated = parsePublication(payload?.data);
    const newsletter = shouldSendNewsletter && updated
      ? await sendPublicationNewsletter({
        id: updated.id,
        title: publicationData.title,
        excerpt: publicationData.excerpt,
        slug: updated.slug,
        targetPages: updated.targetPages,
        attachments: updated.attachments,
      })
      : undefined;
    return NextResponse.json({ data: updated, ...(newsletter ? { newsletter } : {}) });
  }

  return NextResponse.json({ error: 'Aucune base de données disponible pour modifier.' }, { status: 500 });
}

async function siteAuditedDELETE(request: NextRequest) {
  const authorization = await authorizeCommunication(request);
  if (authorization.error) return authorization.error;
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'PostgreSQL n’est pas configuré.' }, { status: 503 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Identifiant de publication requis.' }, { status: 400 });
  }

  if (process.env.DATABASE_URL) {
    try {
      const { rowCount } = await getPostgresPool().query(
        'DELETE FROM public.actualites WHERE id::text = $1',
        [id],
      );
      if (!rowCount) return NextResponse.json({ error: 'Actualité introuvable.' }, { status: 404 });
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Erreur PostgreSQL lors de la suppression d’une actualité:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return NextResponse.json({ error: 'Impossible de supprimer l’actualité.' }, { status: 503 });
    }
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

export const POST = withSiteAudit("Création d’actualité", siteAuditedPOST);
export const PATCH = withSiteAudit("Modification d’actualité", siteAuditedPATCH);
export const DELETE = withSiteAudit("Suppression d’actualité", siteAuditedDELETE);
