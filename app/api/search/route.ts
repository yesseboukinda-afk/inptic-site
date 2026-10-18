import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';
import { strapi } from '@/lib/strapi';

type SearchCategory =
  | 'Page'
  | 'Formation'
  | 'Actualité'
  | 'Annonce'
  | 'Concours'
  | 'Publication'
  | 'Ressource';

type SearchSuggestion = {
  id: string;
  title: string;
  description: string;
  category: SearchCategory;
  href: string;
  searchableText: string;
};

type SearchSource = {
  name: string;
  category: SearchCategory;
  href: string;
  items: unknown[];
};

const STATIC_PAGES: Array<Omit<SearchSuggestion, 'searchableText'>> = [
  { id: 'home', title: 'Accueil INPTIC Gabon', description: 'Institut National de la Poste, des Technologies de l’Information et de la Communication. Actualités, formations, concours, recherche et services.', category: 'Page', href: '/' },
  { id: 'institute', title: 'Présentation de l’INPTIC', description: 'Institut supérieur public au Gabon, histoire, missions, technologies de l’information, télécommunications, formation et innovation.', category: 'Page', href: '/institut/presentation' },
  { id: 'governance', title: 'Gouvernance et direction', description: 'Organisation, direction générale, administration et gouvernance de l’Institut.', category: 'Page', href: '/institut/gouvernance' },
  { id: 'certifications', title: 'Certifications', description: 'Certifications professionnelles, parcours, compétences numériques et informatiques.', category: 'Page', href: '/institut/certifications' },
  { id: 'partnerships', title: 'Partenariats', description: 'Partenaires institutionnels, entreprises, coopération et partenariats académiques.', category: 'Page', href: '/institut/partenariats' },
  { id: 'formations', title: 'Formations INPTIC', description: 'Licence professionnelle, formation qualifiante et certifiante, cursus TIC, informatique, réseaux, télécommunications, audiovisuel et débouchés.', category: 'Formation', href: '/formations' },
  { id: 'management-tic', title: 'Management des TIC et marketing numérique', description: 'E-commerce, marketing digital, commercialisation des technologies de l’information et de la communication, gestion de projets IT.', category: 'Formation', href: '/formations' },
  { id: 'telecoms', title: 'Réseaux et télécommunications', description: 'Télécom, télécommunications, réseau mobile, fibre optique, administration et sécurité des réseaux, systèmes numériques, IoT, réseaux de capteurs, infrastructures et connectivité.', category: 'Formation', href: '/formations/telecoms' },
  { id: 'computer-engineering', title: 'Génie informatique', description: 'Développement logiciel, développement web, applications réparties, bases de données, systèmes d’information, programmation et informatique.', category: 'Formation', href: '/formations/genie-logiciel' },
  { id: 'cybersecurity', title: 'Cybersécurité', description: 'Sécurité informatique, protection des réseaux et des infrastructures télécoms, systèmes d’information, cybermenaces.', category: 'Formation', href: '/formations/cybersecurite' },
  { id: 'audiovisual', title: 'Audiovisuel', description: 'Son, image, montage vidéo, réalisation, production, script, infographie et création numérique.', category: 'Formation', href: '/formations' },
  { id: 'monetique', title: 'Monétique', description: 'Paiement électronique, cartes bancaires, systèmes de paiement, transactions et services financiers numériques.', category: 'Formation', href: '/formations/monetique' },
  { id: 'logistics', title: 'Postes et logistique', description: 'Poste, logistique, services postaux et métiers associés.', category: 'Formation', href: '/formations/postes-logistique' },
  { id: 'concours', title: 'Concours et résultats', description: 'Concours d’entrée, admission, inscription, conditions, dates, résultats, listes des candidats admis et dossiers à fournir.', category: 'Concours', href: '/concours' },
  { id: 'admissions', title: 'Admissions et préinscription', description: 'Guide candidat, ouverture de session, préinscription au concours, formulaire, dépôt du dossier et frais de candidature.', category: 'Page', href: '/admissions' },
  { id: 'admission-guide', title: 'Guide des admissions', description: 'Étapes de candidature, pièces obligatoires, formulaire de candidature, paiement et vérification finale par la Scolarité.', category: 'Page', href: '/admissions/guide' },
  { id: 'news', title: 'Actualités de l’INPTIC', description: 'Actualités, nouvelles, annonces, communiqués, événements et informations de l’Institut.', category: 'Actualité', href: '/actualites' },
  { id: 'announcements', title: 'Annonces et communiqués', description: 'Annonces officielles, communiqués, informations administratives et publications INPTIC.', category: 'Annonce', href: '/annonces' },
  { id: 'research', title: 'Recherche et innovation', description: 'Recherche scientifique, laboratoires, projets étudiants, incubateur, innovation numérique, publications et entrepreneuriat.', category: 'Page', href: '/recherche' },
  { id: 'publications', title: 'Publications scientifiques', description: 'Articles, travaux de recherche, auteurs, résumés, mots-clés, informatique, intelligence artificielle, cybersécurité, réseaux et télécommunications.', category: 'Publication', href: '/recherche/publications' },
  { id: 'laboratories', title: 'Laboratoires de recherche', description: 'Laboratoires, intelligence artificielle, systèmes et IoT, réseaux, télécommunications, cybersécurité et recherche appliquée.', category: 'Page', href: '/recherche/laboratoires' },
  { id: 'projects', title: 'Projets étudiants', description: 'Projets informatiques, numériques, télécoms, innovation, réalisations et travaux des étudiants.', category: 'Page', href: '/recherche/projets' },
  { id: 'incubator', title: 'Incubateur et entrepreneuriat', description: 'Incubation, startups, innovation, accompagnement et création d’entreprise numérique.', category: 'Page', href: '/recherche/incubateur' },
  { id: 'tech-watch', title: 'Veille informatique et actualité IT', description: 'Technologies, informatique, intelligence artificielle, télécoms, cybersécurité, Internet et actualité numérique internationale.', category: 'Actualité', href: '/actualites' },
  { id: 'student-life', title: 'Vie étudiante', description: 'Vie de campus, activités, associations, étudiants et services de l’INPTIC.', category: 'Page', href: '/vie-etudiante' },
  { id: 'clubs', title: 'Clubs et associations étudiantes', description: 'Club sportif, football, taekwondo, boxe, karaté, basketball, club de création numérique, développement, réseau, infographie et audiovisuel. Candidatures aux sous-clubs et activités de campus.', category: 'Page', href: '/clubs' },
  { id: 'companies', title: 'Entreprises et recrutement', description: 'Entreprises, employeurs, recrutement, offres, stages, compétences et partenariats professionnels.', category: 'Page', href: '/entreprises' },
  { id: 'contact', title: 'Contact et localisation', description: 'Contacter l’INPTIC, adresse, téléphone, localisation au Gabon et informations pratiques.', category: 'Page', href: '/contact' },
  { id: 'alumni', title: 'Alumni et anciens étudiants', description: 'Réseau des diplômés, anciens étudiants, parcours professionnels et communauté INPTIC.', category: 'Page', href: '/alumni' },
  { id: 'laws', title: 'Textes et lois', description: 'Textes officiels, lois, arrêtés, réglementation et documents institutionnels.', category: 'Page', href: '/textes-et-lois' },
  { id: 'privacy', title: 'Confidentialité et données personnelles', description: 'Politique de confidentialité, données personnelles, protection et vie privée.', category: 'Page', href: '/confidentialite' },
  { id: 'terms', title: 'Conditions d’utilisation', description: 'Conditions générales, utilisation du site et règles applicables aux services en ligne.', category: 'Page', href: '/conditions-d-utilisation' },
];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .replace(/[’']/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function flattenSearchableText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(flattenSearchableText).join(' ');
  if (!value || typeof value !== 'object') return '';
  return Object.values(value as Record<string, unknown>).map(flattenSearchableText).join(' ');
}

function unwrapCollection(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: unknown[] }).data;
  }
  return [];
}

function toSearchSuggestion(
  item: unknown,
  category: SearchCategory,
  href: string,
  index: number,
): SearchSuggestion | null {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const record = item as Record<string, unknown>;
  const attributes = record.attributes && typeof record.attributes === 'object'
    ? record.attributes as Record<string, unknown>
    : record;
  const titleValue = attributes.title ?? attributes.name ?? attributes.titre;
  if (typeof titleValue !== 'string' || !titleValue.trim()) return null;
  const descriptionValue = attributes.description ?? attributes.excerpt ?? attributes.summary ??
    attributes.abstract ?? attributes.resume;
  const description = typeof descriptionValue === 'string' ? descriptionValue : '';
  const id = record.documentId ?? record.id ?? attributes.slug ?? `${category}-${index}`;
  return {
    id: `${category}-${String(id)}`,
    title: titleValue.trim(),
    description: description.trim(),
    category,
    href,
    searchableText: normalize(`${flattenSearchableText(record)} ${category}`),
  };
}

function scoreSuggestion(item: SearchSuggestion, terms: string[]) {
  const normalizedTitle = normalize(item.title);
  const normalizedText = item.searchableText;
  if (!terms.every((term) => normalizedText.includes(term))) return -1;
  let score = 0;
  for (const term of terms) {
    if (normalizedTitle === term) score += 100;
    else if (normalizedTitle.startsWith(term)) score += 50;
    else if (normalizedTitle.split(' ').includes(term)) score += 30;
    else if (normalizedTitle.includes(term)) score += 20;
    else score += 1;
  }
  return score;
}

function buildStrapiPath(collection: 'formations' | 'actualites') {
  const params = new URLSearchParams({
    'pagination[pageSize]': '100',
    'populate': '*',
    'sort[0]': 'publishedAt:desc',
  });
  return `/${collection}?${params.toString()}`;
}

async function loadStrapiSource(collection: 'formations' | 'actualites'): Promise<SearchSource> {
  const firstPage = await strapi<unknown>(buildStrapiPath(collection));
  const initialItems = unwrapCollection(firstPage);
  const pageCount = firstPage && typeof firstPage === 'object'
    ? Number((firstPage as { meta?: { pagination?: { pageCount?: unknown } } }).meta?.pagination?.pageCount || 1)
    : 1;
  const remainingPages = Number.isFinite(pageCount)
    ? Array.from({ length: Math.max(0, Math.min(pageCount, 50) - 1) }, (_, index) => index + 2)
    : [];
  const otherPages = await Promise.all(remainingPages.map((page) => {
    const params = new URLSearchParams({
      'pagination[pageSize]': '100',
      'pagination[page]': String(page),
      populate: '*',
      'sort[0]': 'publishedAt:desc',
    });
    return strapi<unknown>(`/${collection}?${params.toString()}`);
  }));
  return {
    name: collection,
    category: collection === 'formations' ? 'Formation' : 'Actualité',
    href: collection === 'formations' ? '/formations' : '/actualites',
    items: [ ...initialItems, ...otherPages.flatMap(unwrapCollection) ],
  };
}

async function loadDatabaseSource(
  table: 'actualites' | 'concours' | 'publications' | 'training_catalog',
  terms: string[],
): Promise<unknown[]> {
  const pool = getPostgresPool();
  const patterns = terms.map((term) => `%${term}%`);
  const sourceQueries = {
    actualites: `SELECT to_jsonb(item) AS record FROM public.actualites item
      WHERE status = 'published' AND to_jsonb(item)::text ILIKE ALL($1::text[])`,
    concours: `SELECT to_jsonb(item) AS record FROM public.concours item
      WHERE to_jsonb(item)::text ILIKE ALL($1::text[])`,
    publications: `SELECT to_jsonb(item) AS record FROM public.publications item
      WHERE to_jsonb(item)::text ILIKE ALL($1::text[])`,
    training_catalog: `SELECT to_jsonb(item) AS record FROM public.training_catalog item
      WHERE status = 'published' AND to_jsonb(item)::text ILIKE ALL($1::text[])`,
  } as const;
  const { rows } = await pool.query(sourceQueries[table], [patterns]);
  return rows.map((row: { record: unknown }) => row.record);
}

async function loadDatabaseSources(terms: string[]) {
  const sources: SearchSource[] = [];
  const errors: string[] = [];
  const tableCategories: Array<{
    table: 'actualites' | 'concours' | 'publications' | 'training_catalog';
    category: SearchCategory;
    href: string;
  }> = [
    { table: 'actualites', category: 'Actualité', href: '/actualites' },
    { table: 'concours', category: 'Concours', href: '/concours' },
    { table: 'publications', category: 'Publication', href: '/recherche/publications' },
    { table: 'training_catalog', category: 'Ressource', href: '/formations' },
  ];
  const results = await Promise.all(tableCategories.map(async (source) => {
    try {
      return { source, items: await loadDatabaseSource(source.table, terms) };
    } catch (error) {
      console.error(`Indexation de recherche indisponible pour ${source.table}:`, error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      errors.push(source.table);
      return { source, items: [] };
    }
  }));
  for (const { source, items } of results) {
    if (items.length) {
      sources.push({
        name: source.table,
        category: source.category,
        href: source.href,
        items,
      });
    }
  }
  return { sources, errors };
}

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') || '').trim().slice(0, 120);
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return NextResponse.json({ items: [] });

  const staticItems = STATIC_PAGES.map((page) => ({
    ...page,
    searchableText: normalize(`${page.title} ${page.description} ${page.category}`),
  }));
  const sources: SearchSource[] = [];
  const sourceErrors: string[] = [];

  const strapiResults = await Promise.allSettled([
    loadStrapiSource('formations'),
    loadStrapiSource('actualites'),
  ]);
  strapiResults.forEach((result, index) => {
    const sourceName = index === 0 ? 'formations' : 'actualites';
    if (result.status === 'fulfilled') {
      sources.push(result.value);
    } else {
      console.error(`Indexation Strapi indisponible pour ${sourceName}:`, result.reason instanceof Error ? result.reason.message : 'UNKNOWN_ERROR');
      sourceErrors.push(sourceName);
    }
  });

  if (process.env.DATABASE_URL) {
    const databaseResult = await loadDatabaseSources(terms);
    sources.push(...databaseResult.sources);
    sourceErrors.push(...databaseResult.errors);
  }

  const dynamicItems = sources.flatMap((source) => source.items.flatMap((item, index) => {
    let category = source.category;
    let href = source.href;
    if (source.name === 'actualites' && item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      const attributes = record.attributes && typeof record.attributes === 'object'
        ? record.attributes as Record<string, unknown>
        : record;
      const targets = attributes.target_pages ?? attributes.targetPages;
      const categoryName = typeof attributes.category === 'string'
        ? normalize(attributes.category)
        : '';
      const isContest = categoryName.includes('concours');
      const isAnnouncement = categoryName.includes('annonce') ||
        (Array.isArray(targets) && targets.includes('annonces') && !targets.includes('actualites'));
      if (isContest) {
        category = 'Concours';
        href = '/concours';
      } else if (isAnnouncement) {
        category = 'Annonce';
        href = '/annonces';
      }
    }
    const suggestion = toSearchSuggestion(item, category, href, index);
    return suggestion ? [suggestion] : [];
  }));
  const allItems = [...staticItems, ...dynamicItems];
  const rankedItems = allItems
    .map((item) => ({ item, score: scoreSuggestion(item, terms) }))
    .filter((entry) => entry.score >= 0)
    .sort((first, second) =>
      second.score - first.score || first.item.title.localeCompare(second.item.title, 'fr'),
    );
  const uniqueItems = new Map<string, typeof rankedItems[number]>();
  for (const entry of rankedItems) {
    const key = `${entry.item.category}:${normalize(entry.item.title)}`;
    if (!uniqueItems.has(key)) uniqueItems.set(key, entry);
  }
  const matched = Array.from(uniqueItems.values()).slice(0, 100).map(({ item }) => {
      const { searchableText: _searchableText, ...suggestion } = item;
      return suggestion;
    });

  return NextResponse.json({
    items: matched,
    ...(sourceErrors.length ? { partial: true, unavailableSources: sourceErrors } : {}),
  });
}
