'use client';

/**
 * =========================================================
 * IMPORTS
 * =========================================================
 */

import {
  Search,
  ArrowRight,
  Bot,
  Box,
  FileText,
  GraduationCap,
  X,
  Megaphone,
  ChevronDown,
} from 'lucide-react';

import Link from 'next/link';
import Image from 'next/image';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * =========================================================
 * QUICK ACTIONS
 * =========================================================
 */

const quickActions = [
  {
    key: 'bot',
    label: 'INPTIC-Bot',
    icon: Bot,
    ariaLabel: 'Chat avec le bot INPTIC',
  },
  {
    key: 'visit3d',
    label: 'Visite 3D',
    icon: Box,
    ariaLabel: 'Visiter le campus en 3D',
  },
  {
    key: 'application',
    label: 'Candidature',
    icon: FileText,
    ariaLabel: 'Accéder au formulaire de candidature',
  },
  {
    key: 'alumni',
    label: 'Alumni',
    icon: GraduationCap,
    ariaLabel: 'Accéder à la plateforme Alumni',
  },
  {
    key: 'andcg',
    label: 'ANDCG',
    icon: GraduationCap,
    ariaLabel: 'Annuaire national des diplômés du Gabon',
  },
] as const;

/**
 * =========================================================
 * IMAGES DU HERO
 * =========================================================
 */

const galleryImages = [
  '/institut/1.webp',
  '/formations/informatique.webp',
  '/institut/2.webp',
  '/formations/telecommunications.webp',
  '/institut/3.webp',
  '/formations/management-tic.webp',
  '/institut/4.webp',
  '/formations/multimedia-internet.webp',
  '/institut/5.webp',
];

/**
 * =========================================================
 * TYPES DES FORMATIONS
 * =========================================================
 */

type FormationRecommendation = {
  title: string;
  department: string;
  description: string;
  keywords: string[];
  domains: string[];
  levels: string[];
  bacTypes: string[];
  href: string;
};

const gabonBaccalaureatTypes = [
  { value: 'A1', label: 'A1' },
  { value: 'A2', label: 'A2' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'S', label: 'S' },
  { value: 'F1', label: 'F1' },
  { value: 'F2', label: 'F2' },
  { value: 'F3', label: 'F3' },
  { value: 'F4', label: 'F4' },
  { value: 'ACC', label: 'ACC' },
  { value: 'CG', label: 'CG' },
  { value: 'autre', label: 'Autre type de baccalauréat' },
] as const;

const bacSeriesEquivalences: Record<string, string[]> = {
  A: ['A1', 'A2', 'B'],
  C: ['C', 'D', 'S'],
  D: ['C', 'D', 'S'],
  E: ['F1', 'F2', 'F3', 'F4'],
  F: ['F1', 'F2', 'F3', 'F4'],
  G: ['ACC', 'CG'],
  H: ['A1', 'A2', 'B', 'ACC', 'CG'],
};

/**
 * =========================================================
 * FORMATIONS DISPONIBLES
 * =========================================================
 */

const formationRecommendations: FormationRecommendation[] = [
  {
    title: 'Génie logiciel',
    department: 'Informatique',
    description:
      'Concevoir, développer et maintenir des applications et logiciels fiables.',
    keywords: [
      'logiciel',
      'developpement',
      'web',
      'application',
      'code',
      'programmation',
      'api',
    ],
    domains: ['reseaux-systemes'],
    levels: ['dts', 'licence'],
    bacTypes: ['C', 'D', 'E', 'F', 'autre'],
    href: '/formations/genie-logiciel',
  },

  {
    title: 'Cybersécurité',
    department: 'Informatique',
    description:
      'Protéger les systèmes, les réseaux, les données et les infrastructures numériques.',
    keywords: [
      'cyber',
      'securite',
      'hacking',
      'protection',
      'vulnerabilite',
      'risque',
    ],
    domains: ['reseaux-systemes'],
    levels: ['dts', 'licence'],
    bacTypes: ['C', 'D', 'E', 'F', 'autre'],
    href: '/formations/cybersecurite',
  },

  {
    title: 'Télécommunications',
    department: 'Télécommunications',
    description:
      'Maîtriser les réseaux, les systèmes embarqués, l’IoT et les services numériques.',
    keywords: [
      'reseau',
      'telecom',
      'telecommunication',
      'iot',
      'internet',
      'systeme embarque',
      'infrastructure',
    ],
    domains: ['reseaux-systemes'],
    levels: ['dts', 'licence'],
    bacTypes: ['C', 'D', 'E', 'F', 'autre'],
    href: '/formations/telecoms',
  },

  {
    title: 'Management des TIC',
    department: 'Management & TIC',
    description:
      'Développer des compétences en marketing digital, commerce TIC et gestion de projet.',
    keywords: [
      'management',
      'marketing',
      'commerce',
      'digital',
      'e-commerce',
      'entreprise',
      'gestion',
    ],
    domains: ['management-tic'],
    levels: ['dts', 'licence'],
    bacTypes: ['A', 'C', 'D', 'G', 'H', 'autre'],
    href: '/formations',
  },

  {
    title: 'Audiovisuel et multimédia',
    department: 'Multimédia & Internet',
    description:
      'Créer des contenus en image, son, montage, réalisation et production.',
    keywords: [
      'audiovisuel',
      'image',
      'son',
      'video',
      'montage',
      'infographie',
      'creation',
    ],
    domains: ['audiovisuel'],
    levels: ['dts', 'licence'],
    bacTypes: ['A', 'E', 'F', 'H', 'autre'],
    href: '/formations',
  },

  {
    title: 'Postes & Logistique',
    department: 'Management & TIC',
    description:
      'Piloter les opérations, les flux, la planification et la chaîne logistique.',
    keywords: [
      'logistique',
      'poste',
      'stock',
      'flux',
      'transport',
      'planification',
      'supply chain',
    ],
    domains: ['management-tic'],
    levels: ['dts', 'licence'],
    bacTypes: ['A', 'G', 'H', 'autre'],
    href: '/formations/postes-logistique',
  },

  {
    title: 'Licence Professionnelle Réseaux et Télécommunications',
    department: 'Réseaux et Systèmes Numériques',
    description:
      'Concevoir, administrer et maintenir des réseaux et infrastructures de télécommunication.',
    keywords: [
      'reseau',
      'telecommunication',
      'telecom',
      'infrastructure',
      'administration reseau',
    ],
    domains: ['reseaux-systemes'],
    levels: ['licence'],
    bacTypes: ['C', 'D', 'E', 'F', 'autre'],
    href: '/formations/telecoms',
  },

  {
    title:
      'Licence Professionnelle Administration et Sécurité des Réseaux',
    department: 'Réseaux et Systèmes Numériques',
    description:
      'Administrer les réseaux et renforcer la sécurité des infrastructures numériques.',
    keywords: [
      'reseau',
      'securite',
      'administration',
      'infrastructure',
      'cyber',
    ],
    domains: ['reseaux-systemes'],
    levels: ['licence'],
    bacTypes: ['C', 'D', 'E', 'F', 'autre'],
    href: '/formations/cybersecurite',
  },

  {
    title:
      'Licence Professionnelle Développement d’Applications Réparties',
    department: 'Réseaux et Systèmes Numériques',
    description:
      'Développer des applications distribuées, des API et des services connectés.',
    keywords: [
      'application',
      'repartie',
      'developpement',
      'api',
      'logiciel',
      'programmation',
    ],
    domains: ['reseaux-systemes'],
    levels: ['licence'],
    bacTypes: ['C', 'D', 'E', 'F', 'autre'],
    href: '/formations/genie-logiciel',
  },

  {
    title:
      'Licence Professionnelle Administration de Systèmes et de Bases de Données',
    department: 'Réseaux et Systèmes Numériques',
    description:
      'Administrer les systèmes informatiques et les bases de données des organisations.',
    keywords: [
      'systeme',
      'base de donnees',
      'donnees',
      'administration',
      'serveur',
    ],
    domains: ['reseaux-systemes'],
    levels: ['licence'],
    bacTypes: ['C', 'D', 'E', 'F', 'autre'],
    href: '/formations',
  },

  {
    title:
      'Licence Professionnelle E-commerce & Marketing Digital',
    department: 'Management des TIC',
    description:
      'Développer une activité commerciale en ligne et piloter une stratégie marketing digitale.',
    keywords: [
      'e-commerce',
      'marketing',
      'commerce',
      'digital',
      'vente',
      'communication',
    ],
    domains: ['management-tic'],
    levels: ['licence'],
    bacTypes: ['A', 'G', 'H', 'autre'],
    href: '/formations',
  },

  {
    title:
      'Licence Professionnelle Techniques de Commercialisation des TIC',
    department: 'Management des TIC',
    description:
      'Commercialiser des solutions technologiques et accompagner la transformation numérique.',
    keywords: [
      'commercialisation',
      'commerce',
      'tic',
      'vente',
      'marketing',
      'commercial',
    ],
    domains: ['management-tic'],
    levels: ['licence'],
    bacTypes: ['A', 'G', 'H', 'autre'],
    href: '/formations',
  },

  {
    title: 'Licence Professionnelle en Son',
    department: 'Audiovisuel',
    description:
      'Développer des compétences techniques dans la prise de son et la production audio.',
    keywords: ['son', 'audio', 'audiovisuel', 'production'],
    domains: ['audiovisuel'],
    levels: ['licence'],
    bacTypes: ['A', 'E', 'F', 'H', 'autre'],
    href: '/formations',
  },

  {
    title: 'Licence Professionnelle en Image et Montage',
    department: 'Audiovisuel',
    description:
      'Créer et monter des contenus visuels pour des projets audiovisuels et numériques.',
    keywords: [
      'image',
      'montage',
      'video',
      'audiovisuel',
      'creation',
    ],
    domains: ['audiovisuel'],
    levels: ['licence'],
    bacTypes: ['A', 'E', 'F', 'H', 'autre'],
    href: '/formations',
  },

  {
    title: 'Internet des Objets (IoT) et réseaux de capteurs',
    department: 'Formation qualifiante',
    description:
      'Concevoir des objets connectés et exploiter des réseaux de capteurs.',
    keywords: [
      'iot',
      'objet',
      'connecte',
      'capteur',
      'reseau',
    ],
    domains: ['qualifiante'],
    levels: ['dts', 'licence'],
    bacTypes: ['C', 'D', 'E', 'F', 'autre'],
    href: '/formations/telecoms',
  },

  {
    title: 'Développement Web',
    department: 'Formation qualifiante',
    description:
      'Concevoir, déployer et maintenir des applications web modernes.',
    keywords: [
      'web',
      'site',
      'frontend',
      'backend',
      'application',
      'code',
    ],
    domains: ['qualifiante'],
    levels: ['dts', 'licence'],
    bacTypes: ['C', 'D', 'E', 'F', 'autre'],
    href: '/formations/genie-logiciel',
  },

  {
    title: 'Intelligence Artificielle',
    department: 'Formation qualifiante et certifiante',
    description:
      'Explorer l’analyse de données, la modélisation et l’automatisation intelligente.',
    keywords: [
      'intelligence artificielle',
      'ia',
      'machine learning',
      'donnees',
      'automatisation',
    ],
    domains: ['qualifiante', 'certifiante'],
    levels: ['dts', 'licence'],
    bacTypes: ['C', 'D', 'E', 'F', 'autre'],
    href: '/formations',
  },

  {
    title: 'Big Data',
    department: 'Certification',
    description:
      'Collecter, analyser et exploiter des volumes importants de données.',
    keywords: ['big data', 'donnees', 'data', 'analyse'],
    domains: ['certifiante'],
    levels: ['dts', 'licence'],
    bacTypes: ['C', 'D', 'E', 'autre'],
    href: '/formations',
  },

  {
    title: 'Cloud Computing',
    department: 'Certification',
    description:
      'Administrer, migrer et sécuriser des services et infrastructures cloud.',
    keywords: [
      'cloud',
      'serveur',
      'infrastructure',
      'migration',
    ],
    domains: ['certifiante'],
    levels: ['dts', 'licence'],
    bacTypes: ['C', 'D', 'E', 'F', 'autre'],
    href: '/formations',
  },
];

/**
 * =========================================================
 * NORMALISATION DES RECHERCHES
 * =========================================================
 */

function normalizeSearchValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formationMatchesBacType(
  formation: FormationRecommendation,
  bacType: string,
) {
  if (bacType === 'autre') return true;
  return formation.bacTypes.some((series) =>
    (bacSeriesEquivalences[series] ?? [series]).includes(bacType),
  );
}

/**
 * =========================================================
 * RECHERCHE DE FORMATIONS
 * =========================================================
 */

function findFormationMatches(
  query: string,
  domain: string,
  level: string,
) {
  const bacType = level.startsWith('bac:')
    ? level.slice('bac:'.length)
    : '';
  const normalizedQuery = normalizeSearchValue(
    query.trim(),
  );

  const queryWords = normalizedQuery
    .split(/\s+/)
    .filter(Boolean);

  return formationRecommendations
    .filter((formation) =>
      !bacType ||
      (formationMatchesBacType(formation, bacType) &&
        formation.levels.includes('dts')),
    )
    .map((formation) => {
      const keywordMatches =
        formation.keywords.filter((keyword) => {
          const normalizedKeyword =
            normalizeSearchValue(keyword);

          return (
            normalizedQuery.includes(normalizedKeyword) ||
            queryWords.some(
              (word) =>
                normalizedKeyword.includes(word) ||
                word.includes(normalizedKeyword),
            )
          );
        }).length;

      const domainMatch =
        domain &&
        formation.domains.includes(domain)
          ? 4
          : 0;

      const levelMatch =
        level &&
        !bacType &&
        formation.levels.includes(level)
          ? 1
          : 0;
      const bacMatch =
        bacType && formationMatchesBacType(formation, bacType) ? 5 : 0;

      const score =
        keywordMatches * 3 +
        domainMatch +
        levelMatch +
        bacMatch;

      return {
        formation,
        score,
      };
    })
    .sort(
      (first, second) =>
        second.score - first.score,
    )
    .slice(0, 3)
    .map(({ formation, score }) => ({
      ...formation,
      score: Math.min(
        98,
        Math.max(62, 62 + score * 6),
      ),
    }));
}

/**
 * =========================================================
 * COMPOSANT HERO
 * =========================================================
 */

export default function Hero() {
  const { t } = useTranslation();
  const [background, setBackground] = useState({ current: 0, previous: 0 });
  const [isBackgroundPaused, setIsBackgroundPaused] = useState(false);

  const [selectedAction, setSelectedAction] =
    useState('visit3d');

  const [formationDomain, setFormationDomain] =
    useState('');

  const [formationLevel, setFormationLevel] =
    useState('');

  const [selectedBacSeries, setSelectedBacSeries] =
    useState('');

  const [formationMatches, setFormationMatches] =
    useState<
      ReturnType<typeof findFormationMatches>
    >([]);

  const [showFormationResults, setShowFormationResults] =
    useState(false);

  useEffect(() => {
    if (
      isBackgroundPaused ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setBackground(({ current }) => {
        const next = (current + 1) % galleryImages.length;
        return { current: next, previous: current };
      });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isBackgroundPaused]);

  /**
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <section
      className="relative min-h-[560px] overflow-hidden bg-slate-900 pb-20 sm:min-h-[600px] md:min-h-[510px] md:pb-12 xl:pb-0"
      onMouseEnter={() => setIsBackgroundPaused(true)}
      onMouseLeave={() => setIsBackgroundPaused(false)}
    >

      {/* =====================================================
          HERO BACKGROUND
          ===================================================== */}

      <div className="absolute inset-0 overflow-hidden">
        {[...new Set([background.previous, background.current])].map((index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-slate-950 transition-opacity duration-1000 motion-reduce:transition-none ${
              index === background.current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={galleryImages[index]}
              alt=""
              width={1920}
              height={1080}
              fetchPriority={index === 0 ? 'high' : undefined}
              loading={index === 0 ? 'eager' : 'lazy'}
              sizes="100vw"
              quality={65}
              className="absolute inset-0 h-full w-full object-cover object-center saturate-105 contrast-[1.02]"
              aria-hidden="true"
            />

            <div
              className="absolute inset-0 bg-gradient-to-br from-slate-950/55 via-slate-950/45 to-slate-950/55"
              aria-hidden="true"
            />
          </div>
        ))}
      </div>

      {/* =====================================================
          HERO CONTENT
          ===================================================== */}

      <div className="container-x relative grid items-center gap-8 px-3 py-12 text-white sm:px-4 md:px-0 md:py-28 lg:grid-cols-2 lg:gap-10">

        {/* ===================================================
            COLONNE GAUCHE
            =================================================== */}

        <div className="space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">

          <div className="space-y-4">

            <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
              {t('hero.welcome')}
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-blue-100 sm:text-lg md:text-xl">
              {t('hero.intro')}
            </p>

          </div>

          <a
            href="/formations"
            className="icon-only-mobile mt-4 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-6 py-3 font-semibold transition-all duration-200 hover:bg-blue-700 active:bg-blue-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:w-auto md:mt-8 md:px-8 md:py-4"
            role="button"
            aria-label={t('hero.discover')}
          >
            <span className="btn-label">
              {t('hero.discover')}
            </span>

            <ArrowRight
              size={20}
              aria-hidden="true"
              className="icon-slot transition-transform duration-200 group-hover:translate-x-1"
            />
          </a>

        </div>

        {/* ===================================================
            FORMATION FINDER
            =================================================== */}

        <div className="relative mx-auto w-full max-w-md lg:ml-auto">

          <div
            className={`formation-finder-panel w-full rounded-2xl p-5 shadow-lg transition-all duration-300 sm:p-6 md:p-8 ${
              showFormationResults
                ? 'formation-finder-exit'
                : 'formation-finder-return'
            }`}
          >

            <h2 className="mb-6 text-2xl font-bold md:text-3xl">
              {t('hero.find')}
            </h2>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();

                setFormationMatches(
                  findFormationMatches(
                    '',
                    formationDomain,
                    formationLevel === 'bac' && selectedBacSeries
                      ? `bac:${selectedBacSeries}`
                      : formationLevel,
                  ),
                );

                setFormationDomain('');
                setFormationLevel('');
                setSelectedBacSeries('');
                setShowFormationResults(true);
              }}
            >

              <div className="relative min-w-0">
                <select
                  className="min-h-12 w-full min-w-0 appearance-none border border-slate-200 bg-white py-3 pl-3 pr-10 text-sm leading-normal text-slate-800 transition-colors duration-200 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-base md:min-h-14 md:px-4 md:pr-11"
                  aria-label={t('hero.studyDomain')}
                  value={formationDomain}
                  onChange={(event) =>
                    setFormationDomain(event.target.value)
                  }
                >
                  <option value="">
                    {t('hero.studyDomain')}
                  </option>

                  <option value="management-tic">
                    {t('hero.management')}
                  </option>

                  <option value="reseaux-systemes">
                    {t('hero.networks')}
                  </option>

                  <option value="audiovisuel">
                    {t('hero.audiovisual')}
                  </option>

                  <option value="qualifiante">
                    {t('hero.qualifying')}
                  </option>

                  <option value="certifiante">
                    {t('hero.certifying')}
                  </option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 md:right-4"
                  aria-hidden="true"
                />
              </div>

              <div className="relative min-w-0">
                <select
                  className="min-h-12 w-full min-w-0 appearance-none border border-slate-200 bg-white py-3 pl-3 pr-10 text-sm leading-normal text-slate-800 transition-colors duration-200 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-base md:min-h-14 md:px-4 md:pr-11"
                  aria-label={t('hero.studyLevel')}
                  value={formationLevel}
                  onChange={(event) => {
                    setFormationLevel(event.target.value);
                    setSelectedBacSeries('');
                  }}
                >
                  <option value="">
                    {t('hero.studyLevel')}
                  </option>

                  <option value="dts">
                    DTS
                  </option>

                  <option value="licence">
                    Licence
                  </option>

                  <option value="bac">
                    Baccalauréat
                  </option>

                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 md:right-4"
                  aria-hidden="true"
                />
              </div>

              {formationLevel === 'bac' && (
                <fieldset className="min-w-0">
                  <legend className="mb-2 text-sm font-semibold text-white">
                    Série du baccalauréat gabonais
                  </legend>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {gabonBaccalaureatTypes.map(({ value, label }) => {
                      const isSelected = selectedBacSeries === value;
                      const optionLabel = value === 'autre'
                        ? 'Autre'
                        : `Bac ${label}`;

                      return (
                        <button
                          key={value}
                          type="button"
                          aria-label={value === 'autre' ? label : optionLabel}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedBacSeries(value)}
                          className={`aspect-square min-w-0 rounded-lg border px-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-slate-900 sm:text-sm ${
                            isSelected
                              ? 'border-[#D4AF37] bg-[#D4AF37] text-slate-950 shadow-md'
                              : 'border-white/25 bg-white/10 text-white hover:border-white/60 hover:bg-white/20'
                          }`}
                        >
                          {optionLabel}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              <button
                type="submit"
                className="icon-only-mobile flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 hover:shadow-lg active:scale-95 md:py-4"
                aria-label={t('hero.search')}
              >
                <span className="btn-label">
                  {t('hero.search')}
                </span>

                <Search
                  size={18}
                  aria-hidden="true"
                  className="icon-slot"
                />
              </button>

            </form>

            <p className="mt-4 text-sm leading-relaxed text-blue-100">
              💡 {t('hero.advice')}
            </p>

          </div>

          {/* =================================================
              FORMATION RESULTS
              ================================================= */}

          {showFormationResults && (
              <div
                className="formation-results-enter absolute inset-0 z-30 rounded-2xl border border-white/30 bg-slate-950 p-4 shadow-2xl sm:p-5"
                aria-live="polite"
              >

                <div className="flex items-start justify-between gap-3">

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                      {t('hero.result')}
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-white">
                      {t('hero.recommended')}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowFormationResults(false)
                    }
                    className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    aria-label={t(
                      'hero.closeRecommendations',
                    )}
                    title={t(
                      'hero.closeRecommendations',
                    )}
                  >
                    <X
                      size={20}
                      aria-hidden="true"
                    />
                  </button>

                </div>

                {formationMatches.length > 0 ? (
                  <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                    {formationMatches.map((match) => (
                      <Link
                        key={match.title}
                        href={match.href}
                        className="formation-result-card block rounded-lg bg-white/95 p-3 text-slate-900 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">{match.title}</p>
                            <p className="text-xs text-slate-600">{match.department}</p>
                          </div>
                          <span className="formation-result-score shrink-0 text-xs font-bold text-blue-700">
                            {match.score}%
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">{match.description}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-slate-200">
                    Aucune filière ne correspond à la fois au domaine et au baccalauréat sélectionnés. Essayez un autre domaine.
                  </p>
                )}

              </div>
            )}

        </div>

      </div>

      {/* =====================================================
          QUICK ACTIONS - MOBILE
          ===================================================== */}

      <div className="relative z-20 mt-5 grid grid-cols-5 gap-2 px-3 sm:mt-6 sm:gap-3 sm:px-4 xl:hidden">

        {quickActions.map(
          ({
            key: actionKey,
            icon: Icon,
          }) => {

            const localizedLabel =
              t(`hero.${actionKey}`);

            const localizedAriaLabel =
              t(`hero.${actionKey}Label`);

            const isSelected =
              selectedAction === actionKey;

            /**
             * Contenu commun des boutons mobiles.
             */
            const content = (
              <div
                className={`
                  flex
                  min-h-[72px]
                  w-full
                  min-w-0
                  flex-col
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-white/15
                  bg-gradient-to-b
                  from-slate-800/95
                  to-slate-950/95
                  px-1
                  py-2.5
                  text-center
                  shadow-lg
                  shadow-slate-950/20
                  transition-[border-color,background-color,box-shadow,transform]
                  duration-200
                  hover:-translate-y-0.5
                  hover:border-blue-300/40
                  hover:shadow-xl
                  active:translate-y-0
                  active:scale-[0.98]
                  ${
                    isSelected
                      ? 'border-amber-300/50 from-slate-800 to-slate-900 text-amber-200 shadow-[0_8px_24px_rgba(245,158,11,0.10)]'
                      : 'text-white'
                  }
                `}
              >

                <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                  {actionKey === 'andcg' ? (
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-md bg-white p-0.5 shadow-sm">
                      <img
                        src="/backlinks/ANDCG.svg"
                        alt=""
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        aria-hidden="true"
                      />
                    </div>
                  ) : (
                    <Icon
                      size={18}
                      aria-hidden="true"
                      className={
                        isSelected
                          ? 'text-[#F4D06F]'
                          : 'text-white'
                      }
                    />
                  )}
                </div>

                <span className="max-w-full text-[9px] font-semibold leading-tight sm:text-[11px]">
                  {localizedLabel}
                </span>

              </div>
            );

            /**
             * ANDG
             */
            if (actionKey === 'andcg') {
              return (
                <a
                  key={actionKey}
                  href="https://andg.ga"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={localizedAriaLabel}
                  className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  {content}
                </a>
              );
            }

            /**
             * Liens internes.
             */
            if (
              actionKey === 'visit3d' ||
              actionKey === 'application' ||
              actionKey === 'alumni'
            ) {
              return (
                <Link
                  key={actionKey}
                  href={
                    actionKey === 'visit3d'
                      ? '/visite-3d'
                      : actionKey === 'alumni'
                        ? '/alumni'
                        : '/concours'
                  }
                  aria-label={localizedAriaLabel}
                  className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  {content}
                </Link>
              );
            }

            /**
             * Bot.
             */
            return (
              <button
                key={actionKey}
                type="button"
                onClick={() => {
                  setSelectedAction(actionKey);

                  window.dispatchEvent(
                    new Event('open-inptic-chat'),
                  );
                }}
                aria-label={localizedAriaLabel}
                className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {content}
              </button>
            );
          },
        )}

      </div>

      {/* =====================================================
          QUICK ACTIONS - DESKTOP
          ===================================================== */}

      <div className="absolute bottom-20 right-5 z-30 hidden w-[100px] flex-col gap-1.5 rounded-2xl border border-white/15 bg-slate-950/90 p-2 text-center text-xs shadow-2xl shadow-slate-950/40 backdrop-blur-md animate-in fade-in slide-in-from-right-8 duration-700 xl:flex">

        {quickActions.map(
          ({
            key: actionKey,
            icon: Icon,
          }) => {

            const localizedLabel =
              t(`hero.${actionKey}`);

            const localizedAriaLabel =
              t(`hero.${actionKey}Label`);

            const isSelected =
              selectedAction === actionKey;

            /**
             * Taille uniforme de toutes les actions.
             */
            const commonClassName = `
              flex
              min-h-[72px]
              w-full
              min-w-0
              flex-col
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-transparent
              px-1
              py-2
              transition-[border-color,background-color,box-shadow,transform]
              duration-200
              hover:-translate-y-0.5
              hover:border-blue-300/25
              hover:bg-white/[0.06]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue-300
              ${
                isSelected
                  ? 'border-amber-300/30 bg-amber-300/[0.08] text-amber-200 shadow-[0_8px_24px_rgba(245,158,11,0.08)]'
                  : 'text-white'
              }
            `;

            /**
             * =================================================
             * ANDG
             * =================================================
             */

            if (actionKey === 'andcg') {
              return (
                <a
                  key={actionKey}
                  href="https://andg.ga"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={commonClassName}
                  aria-label={localizedAriaLabel}
                >

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-0.5 shadow-sm">
                    <img
                      src="/backlinks/ANDCG.svg"
                      alt=""
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      aria-hidden="true"
                    />
                  </span>

                  <span
                    className={`text-[10px] font-semibold leading-tight ${
                      isSelected
                        ? 'text-[#F4D06F]'
                        : 'text-white'
                    }`}
                  >
                    {localizedLabel}
                  </span>

                </a>
              );
            }

            /**
             * =================================================
             * LIENS INTERNES
             * =================================================
             */

            if (
              actionKey === 'visit3d' ||
              actionKey === 'application' ||
              actionKey === 'alumni'
            ) {
              return (
                <Link
                  key={actionKey}
                  href={
                    actionKey === 'visit3d'
                      ? '/visite-3d'
                      : actionKey === 'alumni'
                        ? '/alumni'
                        : '/concours'
                  }
                  className={commonClassName}
                  aria-label={localizedAriaLabel}
                >

                  <Icon
                    size={20}
                    aria-hidden="true"
                    className={
                      isSelected
                        ? 'text-amber-200'
                        : 'text-white'
                    }
                  />

                  <span
                    className={`text-[10px] font-semibold leading-tight ${
                      isSelected
                        ? 'text-amber-200'
                        : 'text-white'
                    }`}
                  >
                    {localizedLabel}
                  </span>

                </Link>
              );
            }

            /**
             * =================================================
             * BOT
             * =================================================
             */

            return (
              <button
                key={actionKey}
                type="button"
                onClick={() => {
                  setSelectedAction(actionKey);

                  window.dispatchEvent(
                    new Event('open-inptic-chat'),
                  );
                }}
                className={commonClassName}
                aria-label={localizedAriaLabel}
              >

                <Icon
                  size={20}
                  aria-hidden="true"
                  className={
                    isSelected
                      ? 'text-amber-200'
                      : 'text-white'
                  }
                />

                <span
                  className={`text-[10px] font-semibold leading-tight ${
                    isSelected
                      ? 'text-amber-200'
                      : 'text-white'
                  }`}
                >
                  {localizedLabel}
                </span>

              </button>
            );
          },
        )}

      </div>

      {/* =====================================================
          SCROLL INDICATOR - MOBILE
          ===================================================== */}

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-white/60 animate-bounce opacity-0 md:hidden">

        <span className="text-xs font-medium">
          Parcourez
        </span>

        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>

      </div>

    </section>
  );
}
