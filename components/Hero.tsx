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
} from 'lucide-react';

import Link from 'next/link';
import Image from 'next/image';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Lottie } from 'lottie-react';

/**
 * =========================================================
 * ANIMATIONS LOTTIE
 * =========================================================
 */

import visit3dAnimation from '@/public/quickactions/visit3d.json';
import applicationAnimation from '@/public/quickactions/candidature.json';
import alumniAnimation from '@/public/quickactions/alumni.json';

/**
 * Association entre une action et son animation Lottie.
 *
 * Les actions "bot" et "andg" utilisent leurs icônes/logos
 * classiques.
 */
const quickActionAnimations = {
  visit3d: visit3dAnimation,
  application: applicationAnimation,
  alumni: alumniAnimation,
} as const;

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
    key: 'andg',
    label: 'ANDG',
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
  '/institut/2.webp',
  '/institut/3.webp',
  '/institut/4.webp',
  '/institut/5.webp',
];

/**
 * Duplication des images pour créer
 * une animation de slider continue.
 */
const sliderImages = [...galleryImages, ...galleryImages];

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
  href: string;
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
  const normalizedQuery = normalizeSearchValue(
    query.trim(),
  );

  const queryWords = normalizedQuery
    .split(/\s+/)
    .filter(Boolean);

  return formationRecommendations
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
        formation.levels.includes(level)
          ? 1
          : 0;

      const score =
        keywordMatches * 3 +
        domainMatch +
        levelMatch;

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

  const [selectedAction, setSelectedAction] =
    useState('visit3d');

  const [formationDomain, setFormationDomain] =
    useState('');

  const [formationLevel, setFormationLevel] =
    useState('');

  const [formationMatches, setFormationMatches] =
    useState<
      ReturnType<typeof findFormationMatches>
    >([]);

  const [showFormationResults, setShowFormationResults] =
    useState(false);

  /**
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <section className="relative min-h-[560px] overflow-hidden bg-slate-900 pb-20 sm:min-h-[600px] md:min-h-[510px] md:pb-0">

      {/* =====================================================
          HERO BACKGROUND
          ===================================================== */}

      <div className="absolute inset-0 overflow-hidden">
        <div className="hero-slider-track flex h-full w-max">

          {sliderImages.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="relative h-full w-screen shrink-0"
            >
              <Image
                src={image}
                alt=""
                fill
                priority={index === 0}
                loading={
                  index === 0 ? undefined : 'lazy'
                }
                sizes="100vw"
                quality={65}
                className="object-cover object-center saturate-105 contrast-[1.02]"
                aria-hidden="true"
              />

              <div
                className="absolute inset-0 bg-slate-950/35"
                aria-hidden="true"
              />
            </div>
          ))}

        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/55 via-slate-950/45 to-slate-950/55" />

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
                    formationLevel,
                  ),
                );

                setFormationDomain('');
                setFormationLevel('');
                setShowFormationResults(true);
              }}
            >

              <select
                className="w-full appearance-none rounded-lg bg-white p-3 text-base text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 md:p-4"
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

              <select
                className="w-full appearance-none rounded-lg bg-white p-3 text-base text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 md:p-4"
                aria-label={t('hero.studyLevel')}
                value={formationLevel}
                onChange={(event) =>
                  setFormationLevel(event.target.value)
                }
              >
                <option value="">
                  {t('hero.level')}
                </option>

                <option value="dts">
                  DTS
                </option>

                <option value="licence">
                  Licence
                </option>
              </select>

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

          {showFormationResults &&
            formationMatches.length > 0 && (
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

                <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">

                  {formationMatches.map((match) => (
                    <Link
                      key={match.title}
                      href={match.href}
                      className="block rounded-lg bg-white/95 p-3 text-slate-900 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>
                          <p className="font-bold">
                            {match.title}
                          </p>

                          <p className="text-xs text-slate-600">
                            {match.department}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs font-bold text-blue-700">
                          {match.score}%
                        </span>

                      </div>

                      <p className="mt-2 text-sm text-slate-700">
                        {match.description}
                      </p>

                    </Link>
                  ))}

                </div>

              </div>
            )}

        </div>

      </div>

      {/* =====================================================
          QUICK ACTIONS - MOBILE
          ===================================================== */}

      <div className="relative z-20 mt-6 grid grid-cols-5 gap-1.5 px-3 md:hidden">

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

            const animation =
              actionKey in quickActionAnimations
                ? quickActionAnimations[
                    actionKey as keyof typeof quickActionAnimations
                  ]
                : undefined;

            /**
             * Contenu commun des boutons mobiles.
             */
            const content = (
              <div
                className={`
                  flex
                  min-h-[68px]
                  w-full
                  flex-col
                  items-center
                  justify-center
                  gap-1.5
                  rounded-xl
                  border
                  border-white/20
                  bg-slate-900/85
                  px-1
                  py-2
                  text-center
                  shadow-xl
                  backdrop-blur-md
                  transition-all
                  duration-300
                  hover:scale-105
                  hover:border-[#D4AF37]/80
                  hover:bg-slate-900
                  ${
                    isSelected
                      ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#F4D06F] ring-2 ring-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                      : 'text-white'
                  }
                `}
              >

                {animation ? (
                  <Lottie
                    src={animation}
                    autoplay
                    loop
                    className="h-8 w-8 shrink-0"
                  />
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

                <span className="text-[10px] font-semibold leading-tight">
                  {localizedLabel}
                </span>

              </div>
            );

            /**
             * ANDG
             */
            if (actionKey === 'andg') {
              return (
                <a
                  key={actionKey}
                  href="https://andg.ga"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={localizedAriaLabel}
                  className="block focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  <div className="flex min-h-[68px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-slate-950/90 px-1 py-2 text-center shadow-xl">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white p-1">
                      <img
                        src="/backlinks/ANDCG.svg"
                        alt="Logo ANDCG - Annuaire National des Diplômés et Certifiés du Gabon"
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </span>

                    <span className="text-[10px] font-semibold leading-tight text-white">
                      {localizedLabel}
                    </span>
                  </div>
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
                  className="block focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-slate-950"
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
                className="block focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-slate-950"
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

      <div className="absolute bottom-20 right-5 z-30 hidden w-[96px] flex-col gap-2 rounded-2xl border border-white/25 bg-slate-950/95 p-2 text-center text-xs shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-right-8 duration-1000 xl:flex">

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

            const animation =
              actionKey in quickActionAnimations
                ? quickActionAnimations[
                    actionKey as keyof typeof quickActionAnimations
                  ]
                : undefined;

            /**
             * Taille uniforme de toutes les actions.
             */
            const commonClassName = `
              flex
              min-h-[68px]
              w-full
              flex-col
              items-center
              justify-center
              gap-1
              rounded-lg
              px-1.5
              py-2
              transition-all
              duration-200
              focus:outline-none
              focus:ring-2
              focus:ring-white/70
              ${
                isSelected
                  ? 'bg-[#D4AF37]/20 text-[#F4D06F] ring-1 ring-[#D4AF37]/70 shadow-[0_0_0_1px_rgba(212,175,55,0.7)]'
                  : 'text-white hover:bg-white/10'
              }
            `;

            /**
             * =================================================
             * ANDG
             * =================================================
             */

            if (actionKey === 'andg') {
              return (
                <a
                  key={actionKey}
                  href="https://andg.ga"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={commonClassName}
                  aria-label={localizedAriaLabel}
                >

                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white p-1">
                    <img
                      src="/backlinks/ANDCG.svg"
                      alt=""
                      aria-hidden="true"
                      className="h-full w-full object-contain"
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

                  {animation && (
                    <Lottie
                      src={animation}
                      autoplay
                      loop
                      className="h-8 w-8 shrink-0"
                    />
                  )}

                  <span
                    className={`text-[10px] font-semibold leading-tight ${
                      isSelected
                        ? 'text-[#F4D06F]'
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
                  size={18}
                  aria-hidden="true"
                  className={
                    isSelected
                      ? 'text-[#F4D06F]'
                      : 'text-white'
                  }
                />

                <span
                  className={`text-[10px] font-semibold leading-tight ${
                    isSelected
                      ? 'text-[#F4D06F]'
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
