import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import { canAccessStaffService } from '@/lib/roles';
import { ResearchPublication } from '@/types/publication';

// Graines initiales représentatives des travaux des chercheurs de l'INPTIC Gabon
const SEED_PUBLICATIONS: ResearchPublication[] = [
  {
    id: 'pub-2026-001',
    title: 'Déploiement et Résilience des Réseaux de Capteurs IoT en Milieu Forestier Équatorial Gabonais',
    slug: 'deploiement-resilience-iot-foret-equatoriale-gabon',
    authors: ['Dr. Jean-Marc ONDO (INPTIC)', 'Ing. Patrick MVE (Laboratoire Systèmes & IoT)', 'Pr. A. BIVEGHE'],
    publicationDate: '2026-02-14',
    year: 2026,
    domain: 'Systèmes Embarqués & IoT',
    abstract: 'Cette étude analyse les défis de connectivité radio LoRaWAN et de durabilité énergétique des réseaux de micro-capteurs déployés pour le suivi microclimatique et la détection précoce des feux dans le bassin du Congo. Une topologie maillée auto-réparatrice alimentée par micro-panneaux solaires est validée expérimentalement.',
    keywords: ['IoT', 'LoRaWAN', 'Forêt tropicale', 'Énergie solaire', 'Réseaux de capteurs', 'Gabon'],
    journalOrConference: 'Revue Africaine des Technologies de l’Information et Télécoms (RATIT 2026)',
    doiOrUrl: 'https://doi.org/10.1016/j.inptic.iot.2026.012',
    pdfUrl: '/docs/publications/inptic_iot_foret_2026.pdf',
    attachments: [
      {
        name: 'Article IoT forêt équatoriale 2026.pdf',
        url: '/docs/publications/inptic_iot_foret_2026.pdf',
        type: 'application/pdf',
      },
    ],
    createdAt: '2026-02-14T09:00:00Z',
    updatedAt: '2026-02-14T09:00:00Z',
  },
  {
    id: 'pub-2025-002',
    title: 'Architectures de Cybersécurité Souveraine pour les Systèmes d’Information des Administrations Publiques',
    slug: 'cybersecurite-souveraine-si-administrations-publiques',
    authors: ['Dr. Marcelle ESSONO (DRTI / INPTIC)', 'M. Christian BOURDES (Expert Sécurité SI)'],
    publicationDate: '2025-11-20',
    year: 2025,
    domain: 'Cybersécurité',
    abstract: 'Face à la recrudescence des cybermenaces ciblant les infrastructures critiques en Afrique centrale, cet article propose un cadre de maturité fondé sur le Zero Trust, la cryptographie post-quantique et la localisation des centres d’opérations de sécurité (SOC) territoriaux.',
    keywords: ['Cybersécurité', 'Zero Trust', 'SOC', 'Souveraineté numérique', 'Infrastructures critiques'],
    journalOrConference: 'Actes du Forum International de Cybersécurité d’Afrique Centrale (FICAS 2025)',
    doiOrUrl: 'https://ficas-conf.org/proceedings/2025/inptic-cybersec',
    pdfUrl: '/docs/publications/inptic_cybersec_2025.pdf',
    attachments: [
      {
        name: 'Article cybersécurité souveraine 2025.pdf',
        url: '/docs/publications/inptic_cybersec_2025.pdf',
        type: 'application/pdf',
      },
    ],
    createdAt: '2025-11-20T11:30:00Z',
    updatedAt: '2025-11-20T11:30:00Z',
  },
  {
    id: 'pub-2025-003',
    title: 'Modélisation et Optimisation du Routage sur Réseau Fibre Optique FTTH Urbain à Libreville',
    slug: 'optimisation-routage-fibre-ftth-libreville',
    authors: ['Ing. David MOUIRI (Département Réseaux & Télécoms)', 'Dr. Serge NZIENGUI'],
    publicationDate: '2025-06-10',
    year: 2025,
    domain: 'Réseaux & Télécoms',
    abstract: 'Présentation d’un algorithme d’allocation spectrale et de routage multicouche pour minimiser la latence et prévenir la congestion sur la dorsale nationale à fibre optique dans la zone métropolitaine du Grand Libreville.',
    keywords: ['Fibre optique', 'FTTH', 'Routage', 'QoS', 'Télécommunications', 'Libreville'],
    journalOrConference: 'IEEE Africa Communications Symposium (AfriComm 2025)',
    doiOrUrl: 'https://doi.org/10.1109/AFRICOMM.2025.88210',
    pdfUrl: '/docs/publications/inptic_ftth_libreville_2025.pdf',
    attachments: [
      {
        name: 'Article routage FTTH Libreville 2025.pdf',
        url: '/docs/publications/inptic_ftth_libreville_2025.pdf',
        type: 'application/pdf',
      },
    ],
    createdAt: '2025-06-10T14:00:00Z',
    updatedAt: '2025-06-10T14:00:00Z',
  },
  {
    id: 'pub-2024-004',
    title: 'Apprentissage Automatique pour le Traitement Automatique des Langues Nationales du Gabon',
    slug: 'apprentissage-automatique-langues-nationales-gabon',
    authors: ['Dr. Fabrice NGUEMA (Laboratoire IA & Big Data)', 'Mme. Estelle BEKALE (Doctorante)'],
    publicationDate: '2024-09-05',
    year: 2024,
    domain: 'Intelligence Artificielle',
    abstract: 'Exploration des modèles de langage pré-entraînés à faibles ressources appliqués au Fang, Myènè et Punu. Cet article détaille la méthodologie de constitution de corpus textuels et audio et propose une plateforme de reconnaissance vocale adaptée.',
    keywords: ['Intelligence Artificielle', 'NLP', 'Langues bantoues', 'Machine Learning', 'Patrimoine numérique'],
    journalOrConference: 'Revue Internationale d’Ingénierie Linguistique et Informatique Appliquée',
    doiOrUrl: 'https://doi.org/10.5281/zenodo.inptic.nlp.2024',
    pdfUrl: '/docs/publications/inptic_ia_nlp_2024.pdf',
    attachments: [
      {
        name: 'Article TAL langues nationales 2024.pdf',
        url: '/docs/publications/inptic_ia_nlp_2024.pdf',
        type: 'application/pdf',
      },
    ],
    createdAt: '2024-09-05T08:00:00Z',
    updatedAt: '2024-09-05T08:00:00Z',
  },
];

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
      'SELECT * FROM public.publications ORDER BY year DESC, publication_date DESC',
    );
    if (rows.length) items = rows.map((row) => normalizeRow(row as Record<string, unknown>));
  } catch (error) {
    console.error('Erreur PostgreSQL lors du chargement des publications:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Catalogue des publications indisponible.' }, { status: 503 });
  }

  // Compléter avec les graines si la table est vide
  if (items.length === 0) {
    items = [...SEED_PUBLICATIONS];
  } else {
    for (const seed of SEED_PUBLICATIONS) {
      if (!items.some((i) => i.slug === seed.slug)) {
        items.push(seed);
      }
    }
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

export async function POST(request: NextRequest) {
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

export async function PATCH(request: NextRequest) {
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

export async function DELETE(request: NextRequest) {
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
