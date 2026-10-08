import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { canAccessStaffService } from '@/lib/roles';
import { ConcoursItem } from '@/types/concours';

// Graines initiales réalistes INPTIC Gabon en cas de table vide ou hors ligne
const SEED_CONCOURS: ConcoursItem[] = [
  {
    id: 'seed-concours-2026-dts',
    title: 'Concours d’Entrée en 1ère Année DTS (Diplôme de Technicien Supérieur) — Session 2026',
    slug: 'concours-entree-dts-2026',
    department: 'Réseaux & Télécoms, Génie Logiciel, Multimédia',
    sessionYear: 2026,
    status: 'en_cours',
    description: 'Ouverture officielle des inscriptions au concours d’entrée à l’INPTIC Gabon pour les filières DTS. Les épreuves écrites porteront sur les Mathématiques, la Physique et le Français.',
    conditions: [
      'Être titulaire d’un Baccalauréat scientifique ou technique (C, D, E, F2, F3) ou équivalent.',
      'Être âgé de 23 ans au plus au 31 décembre 2026.',
      'Dossier complet comprenant acte de naissance légalisé, certificat médical et relevés de notes du Bac.',
      'Frais de dossier de 20 000 FCFA à régler en ligne ou à la scolarité.',
    ],
    calendar: {
      registrationStart: '2026-03-01T08:00:00Z',
      registrationEnd: '2026-05-15T18:00:00Z',
      examDate: '2026-06-05T07:30:00Z',
      resultsDate: '2026-06-25T12:00:00Z',
    },
    attachments: [
      {
        name: 'Arrêté ministériel d’ouverture du concours 2026.pdf',
        url: '/docs/arrete_concours_2026.pdf',
        size: 1450000,
        type: 'application/pdf',
      },
      {
        name: 'Fiche d’inscription et pièces à fournir 2026.pdf',
        url: '/docs/fiche_inscription_2026.pdf',
        size: 420000,
        type: 'application/pdf',
      },
    ],
    results: {
      published: false,
      admittedList: [],
      waitingList: [],
    },
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'seed-concours-2026-licence',
    title: 'Concours Spécial d’Admission en Licence Professionnelle (L3) — Session 2026',
    slug: 'concours-admission-licence-pro-2026',
    department: 'Cybersécurité, Systèmes Embarqués & IoT, Management des TIC',
    sessionYear: 2026,
    status: 'a_venir',
    description: 'Concours ouvert aux titulaires d’un DTS, BTS ou DUT en informatique, réseaux, télécommunications ou gestion désireux d’intégrer le cycle Licence Professionnelle.',
    conditions: [
      'Titulaire d’un Bac+2 validé (DTS, BTS, DUT) dans les domaines numériques ou tertiaires.',
      'Moyenne minimale requise de 12/20 sur les deux années préparatoires.',
      'Entretien technique et test de compétences spécialisées.',
    ],
    calendar: {
      registrationStart: '2026-05-20T08:00:00Z',
      registrationEnd: '2026-07-10T18:00:00Z',
      examDate: '2026-07-22T08:00:00Z',
      resultsDate: '2026-08-05T12:00:00Z',
    },
    attachments: [
      {
        name: 'Guide d’orientation Licence Professionnelle 2026.pdf',
        url: '/docs/guide_licence_pro_2026.pdf',
        size: 890000,
        type: 'application/pdf',
      },
    ],
    results: {
      published: false,
      admittedList: [],
      waitingList: [],
    },
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'seed-concours-2025-dts-termine',
    title: 'Concours d’Entrée en 1ère Année DTS — Session 2025 (Terminé)',
    slug: 'concours-entree-dts-2025-resultats',
    department: 'Toutes filières DTS',
    sessionYear: 2025,
    status: 'termine',
    description: 'Le concours de la session 2025 est officiellement clôturé. Les procès-verbaux de délibération et listes des candidats admis et en liste d’attente sont disponibles en téléchargement ci-dessous.',
    conditions: [
      'Titulaire du Baccalauréat session 2025 ou antérieure.',
    ],
    calendar: {
      registrationStart: '2025-03-01T08:00:00Z',
      registrationEnd: '2025-05-15T18:00:00Z',
      examDate: '2025-06-07T08:00:00Z',
      resultsDate: '2025-06-28T14:00:00Z',
    },
    attachments: [],
    results: {
      published: true,
      publishedAt: '2025-06-28T14:00:00Z',
      pdfUrl: '/docs/pv_resultats_concours_2025.pdf',
      notes: 'Les candidats admis sont priés de se présenter à la scolarité avant le 15 septembre pour la validation définitive de leur inscription munis des pièces originales.',
      admittedList: [
        'MBOUMBA Jean-Pierre — DTS Génie Logiciel (Mention Bien)',
        'NZAMBA Claire Laure — DTS Réseaux & Télécoms (Mention Très Bien)',
        'OBIANG Arnaud — DTS Multimédia & Internet (Mention Bien)',
        'NGOUA Karl Éric — DTS Génie Logiciel (Mention Assez Bien)',
        'BEKALE Sarah Estelle — DTS Réseaux & Télécoms (Mention Bien)',
        'MVE MINTSA Christian — DTS Multimédia & Internet (Mention Assez Bien)',
        'KASSA Grâce Audrey — DTS Génie Logiciel (Mention Bien)',
      ],
      waitingList: [
        '1. ONDO Guy Roger — DTS Génie Logiciel',
        '2. MENGUE Patricia — DTS Réseaux & Télécoms',
        '3. BOULINGUI Marc — DTS Multimédia',
      ],
    },
    createdAt: '2025-03-01T08:00:00Z',
    updatedAt: '2025-06-28T14:00:00Z',
  },
];

async function authorizeStaff(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 }) };
  }

  if (!canAccessStaffService(user.role, 'concours', user.user_metadata.service ?? user.user_metadata.department)) {
    return {
      error: NextResponse.json({ error: 'Accès non autorisé pour la gestion des concours.' }, { status: 403 }),
    };
  }

  return { user };
}

function normalizeConcoursRow(row: Record<string, unknown>): ConcoursItem {
  return {
    id: String(row.id),
    title: String(row.title || ''),
    slug: String(row.slug || ''),
    department: String(row.department || 'Général'),
    sessionYear: Number(row.session_year || row.sessionYear || new Date().getFullYear()),
    status: (row.status as any) || 'en_cours',
    description: String(row.description || ''),
    conditions: Array.isArray(row.conditions) ? row.conditions : [],
    calendar: typeof row.calendar === 'object' && row.calendar !== null ? (row.calendar as any) : {},
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    results: typeof row.results === 'object' && row.results !== null ? (row.results as any) : {
      published: false,
      admittedList: [],
      waitingList: [],
    },
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
    updatedAt: String(row.updated_at || row.updatedAt || new Date().toISOString()),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const yearFilter = searchParams.get('year');

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'La base PostgreSQL n’est pas configurée.' }, { status: 503 });
  }

  let items: ConcoursItem[];
  try {
    const { rows } = await getPostgresPool().query(
      'SELECT * FROM public.concours ORDER BY session_year DESC, created_at DESC',
    );
    items = rows.length
      ? rows.map((row) => normalizeConcoursRow(row as Record<string, unknown>))
      : [...SEED_CONCOURS];

    const { rows: newsRows } = await getPostgresPool().query(
      `SELECT id, title, slug, excerpt, attachments, published_at, created_at, updated_at
       FROM public.actualites
       WHERE category = 'Concours'
          OR title ILIKE '%concours%'
          OR title ILIKE '%résultats%'`,
    );
    for (const article of newsRows) {
      if (items.some((item) => item.slug === article.slug)) continue;
      const title = String(article.title || '');
      const attachments = Array.isArray(article.attachments) ? article.attachments : [];
      const isResult = /(résultat|resultat|admis)/i.test(title) && attachments.length > 0;
      const yearMatch = title.match(/202[0-9]/);
      const sessionYear = yearMatch
        ? Number.parseInt(yearMatch[0], 10)
        : new Date(article.created_at || Date.now()).getFullYear();
      const isPastYear = sessionYear < new Date().getFullYear();
      items.push({
        id: `annonce-migrated-${article.id}`,
        title,
        slug: String(article.slug || `concours-${article.id}`),
        department: 'Toutes filières',
        sessionYear,
        status: isPastYear || isResult ? 'termine' : 'en_cours',
        description: String(article.excerpt || ''),
        conditions: ['Dossier de candidature soumis conformément aux directives de la note d’information.'],
        calendar: { examDate: article.published_at, resultsDate: isResult ? article.published_at : null },
        attachments,
        results: {
          published: isResult,
          publishedAt: isResult ? article.published_at : null,
          pdfUrl: attachments[0]?.url || null,
          admittedList: [],
          waitingList: [],
          notes: isResult ? article.excerpt : null,
        },
        createdAt: article.created_at || new Date().toISOString(),
        updatedAt: article.updated_at || article.created_at || new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Erreur PostgreSQL lors du chargement des concours:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de charger les concours.' }, { status: 503 });
  }

  // Filtrage
  if (statusFilter) {
    items = items.filter((c) => c.status === statusFilter);
  }
  if (yearFilter) {
    const y = parseInt(yearFilter, 10);
    items = items.filter((c) => c.sessionYear === y);
  }

  // Tri : années récentes en premier, puis date de création
  items.sort((a, b) => {
    if (b.sessionYear !== a.sessionYear) {
      return b.sessionYear - a.sessionYear;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json({ data: items, count: items.length });
}

export async function POST(request: NextRequest) {
  const auth = await authorizeStaff(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body || !body.title) {
    return NextResponse.json({ error: 'Le titre du concours est obligatoire.' }, { status: 400 });
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
    department: body.department || 'Général',
    session_year: body.sessionYear || new Date().getFullYear(),
    status: body.status || 'en_cours',
    description: body.description || '',
    conditions: Array.isArray(body.conditions) ? body.conditions : [],
    calendar: body.calendar || {},
    attachments: Array.isArray(body.attachments) ? body.attachments : [],
    results: body.results || { published: false, admittedList: [], waitingList: [] },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'La base PostgreSQL n’est pas configurée.' }, { status: 503 });
  }
  try {
    const { rows } = await getPostgresPool().query(
      `INSERT INTO public.concours
         (title, slug, department, session_year, status, description,
          conditions, calendar, attachments, results)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        row.title, row.slug, row.department, row.session_year, row.status, row.description,
        JSON.stringify(row.conditions), JSON.stringify(row.calendar),
        JSON.stringify(row.attachments), JSON.stringify(row.results),
      ],
    );
    return NextResponse.json({ data: normalizeConcoursRow(rows[0] as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    console.error('Erreur PostgreSQL lors de la création d’un concours:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible d’enregistrer le concours.' }, { status: 503 });
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest) {
  const auth = await authorizeStaff(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body || !body.id) {
    return NextResponse.json({ error: 'Identifiant du concours requis.' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.title !== undefined) updates.title = body.title;
  if (body.department !== undefined) updates.department = body.department;
  if (body.sessionYear !== undefined) updates.session_year = body.sessionYear;
  if (body.status !== undefined) updates.status = body.status;
  if (body.description !== undefined) updates.description = body.description;
  if (body.conditions !== undefined) updates.conditions = body.conditions;
  if (body.calendar !== undefined) updates.calendar = body.calendar;
  if (body.attachments !== undefined) updates.attachments = body.attachments;
  if (body.results !== undefined) updates.results = body.results;

  if (!UUID_REGEX.test(String(body.id)) && typeof body.slug !== 'string') {
    return NextResponse.json({ error: 'Identifiant UUID ou slug valide requis.' }, { status: 400 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'La base PostgreSQL n’est pas configurée.' }, { status: 503 });
  }
  const columnMap: Record<string, string> = {
    title: 'title', department: 'department', session_year: 'session_year',
    status: 'status', description: 'description', conditions: 'conditions',
    calendar: 'calendar', attachments: 'attachments', results: 'results',
  };
  const entries = Object.entries(updates).filter(([key]) => key !== 'updated_at');
  const values = entries.map(([key, value]) =>
    ['conditions', 'calendar', 'attachments', 'results'].includes(key) ? JSON.stringify(value) : value,
  );
  const assignments = entries.map(([key], index) => `${columnMap[key]} = $${index + 1}`);
  const identifier = UUID_REGEX.test(String(body.id)) ? String(body.id) : body.slug;
  values.push(identifier);
  try {
    const { rows } = await getPostgresPool().query(
      `UPDATE public.concours SET ${assignments.join(', ')}, updated_at = NOW()
       WHERE ${UUID_REGEX.test(String(body.id)) ? 'id::text' : 'slug'} = $${values.length}
       RETURNING *`,
      values,
    );
    if (!rows[0]) return NextResponse.json({ error: 'Concours introuvable.' }, { status: 404 });
    return NextResponse.json({ data: normalizeConcoursRow(rows[0] as Record<string, unknown>) });
  } catch (error) {
    console.error('Erreur PostgreSQL lors de la mise à jour d’un concours:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de mettre à jour le concours.' }, { status: 503 });
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
      `DELETE FROM public.concours WHERE ${UUID_REGEX.test(id) ? 'id::text' : 'slug'} = $1`,
      [id],
    );
    if (!rowCount) return NextResponse.json({ error: 'Concours introuvable.' }, { status: 404 });
  } catch (error) {
    console.error('Erreur PostgreSQL lors de la suppression d’un concours:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de supprimer le concours.' }, { status: 503 });
  }

  return NextResponse.json({ success: true, id });
}
