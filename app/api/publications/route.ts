import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import { canAccessStaffService } from '@/lib/roles';
import { ResearchPublication } from '@/types/publication';

async function authorizeStaff(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 }) };
  }

  if (!canAccessStaffService(user.role, 'publications', user.user_metadata.service ?? user.user_metadata.department)) {
    return {
      error: NextResponse.json(
        { error: 'Accès non autorisé pour la gestion des publications scientifiques.' },
        { status: 403 }
      ),
    };
  }

  return { user };
}

function normalizeRow(row: Record<string, unknown>): ResearchPublication {
  return {
    id: String(row.id),
    title: String(row.title || ''),
    slug: String(row.slug || ''),
    authors: Array.isArray(row.authors) ? (row.authors as string[]) : [],
    publicationDate: String(row.publication_date || row.publicationDate || new Date().toISOString().slice(0, 10)),
    year: Number(row.year || new Date().getFullYear()),
    domain: String(row.domain || 'Informatique & Télécoms'),
    abstract: String(row.abstract || ''),
    keywords: Array.isArray(row.keywords) ? (row.keywords as string[]) : [],
    journalOrConference: row.journal_or_conference ? String(row.journal_or_conference) : null,
    doiOrUrl: row.doi_or_url ? String(row.doi_or_url) : null,
    pdfUrl: row.pdf_url ? String(row.pdf_url) : null,
    attachments: Array.isArray(row.attachments) && (row.attachments as unknown[]).length > 0
      ? (row.attachments as ResearchPublication['attachments'])
      : row.pdf_url
        ? [{ name: 'Article PDF', url: String(row.pdf_url), type: 'application/pdf' }]
        : [],
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
    updatedAt: String(row.updated_at || row.updatedAt || new Date().toISOString()),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainFilter = searchParams.get('domain');
  const yearFilter = searchParams.get('year');
  const authorFilter = searchParams.get('author');
  const query = searchParams.get('q');
  let items: ResearchPublication[] = [];

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'La base PostgreSQL n’est pas configurée.' }, { status: 503 });
  }
  try {
    const { rows } = await getPostgresPool().query(
      `SELECT * FROM public.publications
       WHERE slug NOT IN (
         'deploiement-resilience-iot-foret-equatoriale-gabon',
         'cybersecurite-souveraine-si-administrations-publiques',
         'optimisation-routage-fibre-ftth-libreville',
         'apprentissage-automatique-langues-nationales-gabon'
       )
       ORDER BY year DESC, publication_date DESC`,
    );
    items = rows.map((row) => normalizeRow(row as Record<string, unknown>));
  } catch (error) {
    console.error('Erreur PostgreSQL lors du chargement des publications:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Catalogue des publications indisponible.' }, { status: 503 });
  }

  // Filtres
  if (domainFilter && domainFilter !== 'all') {
    items = items.filter((p) => p.domain.toLowerCase() === domainFilter.toLowerCase());
  }
  if (yearFilter && yearFilter !== 'all') {
    const y = parseInt(yearFilter, 10);
    items = items.filter((p) => p.year === y);
  }
  if (authorFilter && authorFilter.trim()) {
    const a = authorFilter.toLowerCase();
    items = items.filter((p) => p.authors.some((author) => author.toLowerCase().includes(a)));
  }
  if (query && query.trim()) {
    const q = query.toLowerCase();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.abstract.toLowerCase().includes(q) ||
        p.keywords.some((k) => k.toLowerCase().includes(q)) ||
        p.authors.some((author) => author.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({ data: items, count: items.length });
}

async function siteAuditedPOST(request: NextRequest) {
  const auth = await authorizeStaff(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body || !body.title) {
    return NextResponse.json({ error: 'Le titre de la publication est obligatoire.' }, { status: 400 });
  }

  const slug = (body.slug || body.title)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-4);

  const row = {
    title: body.title.trim(),
    slug,
    authors: Array.isArray(body.authors) ? body.authors : [],
    publication_date: body.publicationDate || new Date().toISOString().slice(0, 10),
    year: body.year || new Date().getFullYear(),
    domain: body.domain || 'Informatique & Télécoms',
    abstract: body.abstract || '',
    keywords: Array.isArray(body.keywords) ? body.keywords : [],
    journal_or_conference: body.journalOrConference || null,
    doi_or_url: body.doiOrUrl || null,
    pdf_url: body.pdfUrl || null,
    attachments: Array.isArray(body.attachments) ? body.attachments : [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'La base PostgreSQL n’est pas configurée.' }, { status: 503 });
  }
  try {
    const { rows } = await getPostgresPool().query(
      `INSERT INTO public.publications
         (title, slug, authors, publication_date, year, domain, abstract, keywords,
          journal_or_conference, doi_or_url, pdf_url, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        row.title, row.slug, JSON.stringify(row.authors), row.publication_date,
        row.year, row.domain, row.abstract, JSON.stringify(row.keywords),
        row.journal_or_conference, row.doi_or_url, row.pdf_url, JSON.stringify(row.attachments),
      ],
    );
    return NextResponse.json({ data: normalizeRow(rows[0] as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    console.error('Erreur PostgreSQL lors de la création d’une publication:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible d’enregistrer la publication.' }, { status: 503 });
  }
}

async function siteAuditedPATCH(request: NextRequest) {
  const auth = await authorizeStaff(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body || !body.id) {
    return NextResponse.json({ error: 'Identifiant de publication requis.' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.title !== undefined) updates.title = body.title;
  if (body.authors !== undefined) updates.authors = body.authors;
  if (body.publicationDate !== undefined) updates.publication_date = body.publicationDate;
  if (body.year !== undefined) updates.year = body.year;
  if (body.domain !== undefined) updates.domain = body.domain;
  if (body.abstract !== undefined) updates.abstract = body.abstract;
  if (body.keywords !== undefined) updates.keywords = body.keywords;
  if (body.journalOrConference !== undefined) updates.journal_or_conference = body.journalOrConference;
  if (body.doiOrUrl !== undefined) updates.doi_or_url = body.doiOrUrl;
  if (body.pdfUrl !== undefined) updates.pdf_url = body.pdfUrl;
  if (body.attachments !== undefined) updates.attachments = body.attachments;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'La base PostgreSQL n’est pas configurée.' }, { status: 503 });
  }
  const columnMap: Record<string, string> = {
    title: 'title',
    authors: 'authors',
    publication_date: 'publication_date',
    year: 'year',
    domain: 'domain',
    abstract: 'abstract',
    keywords: 'keywords',
    journal_or_conference: 'journal_or_conference',
    doi_or_url: 'doi_or_url',
    pdf_url: 'pdf_url',
    attachments: 'attachments',
  };
  const entries = Object.entries(updates).filter(([key]) => key !== 'updated_at');
  const values = entries.map(([key, value]) =>
    ['authors', 'keywords', 'attachments'].includes(key) ? JSON.stringify(value) : value,
  );
  const assignments = entries.map(([key], index) => `${columnMap[key]} = $${index + 1}`);
  values.push(body.id);
  try {
    const { rows } = await getPostgresPool().query(
      `UPDATE public.publications SET ${assignments.join(', ')}, updated_at = NOW()
       WHERE id::text = $${values.length} RETURNING *`,
      values,
    );
    if (!rows[0]) return NextResponse.json({ error: 'Publication introuvable.' }, { status: 404 });
    return NextResponse.json({ data: normalizeRow(rows[0] as Record<string, unknown>) });
  } catch (error) {
    console.error('Erreur PostgreSQL lors de la mise à jour d’une publication:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de mettre à jour la publication.' }, { status: 503 });
  }
}

async function siteAuditedDELETE(request: NextRequest) {
  const auth = await authorizeStaff(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Identifiant requis.' }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'La base PostgreSQL n’est pas configurée.' }, { status: 503 });
  }
  try {
    const { rowCount } = await getPostgresPool().query(
      'DELETE FROM public.publications WHERE id::text = $1',
      [id],
    );
    if (!rowCount) return NextResponse.json({ error: 'Publication introuvable.' }, { status: 404 });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Erreur PostgreSQL lors de la suppression d’une publication:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de supprimer la publication.' }, { status: 503 });
  }
}

export const POST = withSiteAudit("Création de publication scientifique", siteAuditedPOST);
export const PATCH = withSiteAudit("Modification de publication scientifique", siteAuditedPATCH);
export const DELETE = withSiteAudit("Suppression de publication scientifique", siteAuditedDELETE);
