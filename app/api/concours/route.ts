import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import {
  isAdminAccountEmail,
  isAdminRole,
  isCommunicationRole,
  isDirectorAccountEmail,
  isDirectorRole,
  normalizeRole,
} from '@/lib/roles';
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
  const accessToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return { error: NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 }) };
  }

  if (!supabaseAdmin) {
    return {
      error: NextResponse.json(
        { error: 'Configuration serveur Supabase manquante (SUPABASE_SERVICE_ROLE_KEY).' },
        { status: 500 }
      ),
    };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    return { error: NextResponse.json({ error: 'Session expirée ou invalide.' }, { status: 401 }) };
  }

  const role = normalizeRole(
    data.user.app_metadata?.role ??
    data.user.app_metadata?.roles ??
    data.user.user_metadata?.role ??
    data.user.user_metadata?.roles
  );
  const email = data.user.email || '';

  const isAuthorized =
    isAdminRole(role) ||
    isDirectorRole(role) ||
    isCommunicationRole(role) ||
    role === 'scolarite' ||
    role === 'direction_etudes' ||
    isAdminAccountEmail(email) ||
    isDirectorAccountEmail(email);

  if (!isAuthorized) {
    return {
      error: NextResponse.json({ error: 'Accès non autorisé pour la gestion des concours.' }, { status: 403 }),
    };
  }

  return { user: data.user };
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

  let items: ConcoursItem[] = [];

  // 1. Tenter lecture depuis table `concours` dans Supabase
  if (supabaseAdmin || supabase) {
    const client = supabaseAdmin || supabase;
    if (client) {
      try {
        const query = client
          .from('concours')
          .select('*')
          .order('session_year', { ascending: false })
          .order('created_at', { ascending: false });

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          items = data.map((d) => normalizeConcoursRow(d as Record<string, unknown>));
        }
      } catch {
        // Table pas encore migrée ou non créée
      }
    }
  }

  // 2. Migration automatique des annonces existantes (catégorie 'Concours')
  if (supabaseAdmin || supabase) {
    const client = supabaseAdmin || supabase;
    if (client) {
      try {
        const { data: annoncesData, error } = await client
          .from('actualites')
          .select('*')
          .or('category.eq.Concours,title.ilike.%concours%,title.ilike.%résultats%');

        if (!error && Array.isArray(annoncesData)) {
          for (const a of annoncesData) {
            const alreadyExists = items.some((c) => c.slug === a.slug || c.id === String(a.id));
            if (!alreadyExists) {
              const titleLower = String(a.title || '').toLowerCase();
              const hasAttachments = Array.isArray(a.attachments) && a.attachments.length > 0;
              const isResult = (titleLower.includes('résultat') || titleLower.includes('resultat') || titleLower.includes('admis')) && hasAttachments;
              const yearMatch = a.title?.match(/202[0-9]/);
              const sessionYear = yearMatch ? parseInt(yearMatch[0], 10) : new Date(a.created_at || Date.now()).getFullYear();
              const isPastYear = sessionYear < new Date().getFullYear();

              const migratedConcours: ConcoursItem = {
                id: `annonce-migrated-${a.id}`,
                title: a.title,
                slug: a.slug || `concours-${a.id}`,
                department: 'Toutes filières',
                sessionYear,
                status: isPastYear || isResult ? 'termine' : 'en_cours',
                description: a.excerpt || '',
                conditions: [
                  'Dossier de candidature soumis conformément aux directives de la note d’information.',
                ],
                calendar: {
                  examDate: a.published_at,
                  resultsDate: isResult ? a.published_at : null,
                },
                attachments: Array.isArray(a.attachments) ? a.attachments : [],
                results: {
                  published: isResult,
                  publishedAt: isResult ? a.published_at : null,
                  pdfUrl: a.attachments?.[0]?.url || null,
                  admittedList: [],
                  waitingList: [],
                  notes: isResult ? a.excerpt : null,
                },
                createdAt: a.created_at || new Date().toISOString(),
                updatedAt: a.updated_at || a.created_at || new Date().toISOString(),
              };

              items.push(migratedConcours);
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }

  // 3. Si aucun élément trouvé, insérer les graines dans la base de données (si supabaseAdmin dispo) sans id string
  if (items.length === 0) {
    if (supabaseAdmin) {
      try {
        const rowsToInsert = SEED_CONCOURS.map(({ id: _id, ...seed }) => ({
          title: seed.title,
          slug: seed.slug,
          department: seed.department,
          session_year: seed.sessionYear,
          status: seed.status,
          description: seed.description,
          conditions: seed.conditions,
          calendar: seed.calendar,
          attachments: seed.attachments,
          results: seed.results,
        }));
        const { error: upsertError } = await supabaseAdmin
          .from('concours')
          .upsert(rowsToInsert, { onConflict: 'slug', ignoreDuplicates: true });

        if (!upsertError) {
          const { data: refetched } = await supabaseAdmin
            .from('concours')
            .select('*')
            .order('session_year', { ascending: false })
            .order('created_at', { ascending: false });
          if (refetched && Array.isArray(refetched)) {
            items = refetched.map((d) => normalizeConcoursRow(d as Record<string, unknown>));
          }
        }
      } catch {
        items = [...SEED_CONCOURS];
      }
    }
    if (items.length === 0) {
      items = [...SEED_CONCOURS];
    }
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

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from('concours').insert([row]).select().single();
      if (!error && data) {
        return NextResponse.json({ data: normalizeConcoursRow(data as Record<string, unknown>) }, { status: 201 });
      }
      if (error && !error.message.includes('relation "concours" does not exist')) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } catch {
      // Table fallback
    }
  }

  // Fallback in-memory / response
  return NextResponse.json(
    {
      data: {
        id: `concours-${Date.now()}`,
        ...row,
        sessionYear: row.session_year,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    },
    { status: 201 }
  );
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

  if (supabaseAdmin) {
    try {
      let query = supabaseAdmin.from('concours').update(updates);
      if (UUID_REGEX.test(body.id)) {
        query = query.eq('id', body.id);
      } else if (body.slug) {
        query = query.eq('slug', body.slug);
      } else {
        // Si l'id n'est pas un UUID (ex: ancien ID seed), tenter d'insérer ou de faire un upsert
        const { data, error } = await supabaseAdmin.from('concours').insert([updates]).select().single();
        if (!error && data) {
          return NextResponse.json({ data: normalizeConcoursRow(data as Record<string, unknown>) });
        }
        return NextResponse.json({ error: 'Identifiant UUID valide requis pour la mise à jour.' }, { status: 400 });
      }

      const { data, error } = await query.select().single();
      if (!error && data) {
        return NextResponse.json({ data: normalizeConcoursRow(data as Record<string, unknown>) });
      }
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Erreur mise à jour.' }, { status: 500 });
    }
  }

  return NextResponse.json({ data: { id: body.id, ...updates, sessionYear: updates.session_year } });
}

export async function DELETE(request: NextRequest) {
  const auth = await authorizeStaff(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Identifiant requis.' }, { status: 400 });
  }

  if (supabaseAdmin) {
    try {
      let query = supabaseAdmin.from('concours').delete();
      if (UUID_REGEX.test(id)) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', id);
      }
      const { error } = await query;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Erreur lors de la suppression.' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Configuration serveur Supabase manquante.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, id });
}
