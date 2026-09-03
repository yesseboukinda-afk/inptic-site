'use client';

import { Search, ArrowRight, Bot, Box, FileText, GraduationCap, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const quickActions = [
  { label: 'INPTIC-Bot', icon: Bot, ariaLabel: 'Chat avec le bot INPTIC' },
  { label: 'Visite 3D', icon: Box, ariaLabel: 'Visiter le campus en 3D' },
  { label: 'Candidature', icon: FileText, ariaLabel: 'Accéder au formulaire de candidature' },
  { label: 'Alumni', icon: GraduationCap, ariaLabel: 'Accéder à la plateforme Alumni' },
];

const galleryImages = [
  '/institut/1.jpg',
  '/institut/2.jpg',
  '/institut/3.jpg',
  '/institut/4.jpg',
  '/institut/5.jpg',
];

const sliderImages = [...galleryImages, ...galleryImages];

type FormationRecommendation = {
  title: string;
  department: string;
  description: string;
  keywords: string[];
  domains: string[];
  levels: string[];
  href: string;
};

const formationRecommendations: FormationRecommendation[] = [
  {
    title: 'Génie logiciel',
    department: 'Informatique',
    description: 'Concevoir, développer et maintenir des applications et logiciels fiables.',
    keywords: ['logiciel', 'developpement', 'web', 'application', 'code', 'programmation', 'api'],
    domains: ['reseaux-systemes'],
    levels: ['dts', 'licence'],
    href: '/formations/genie-logiciel',
  },
  {
    title: 'Cybersécurité',
    department: 'Informatique',
    description: 'Protéger les systèmes, les réseaux, les données et les infrastructures numériques.',
    keywords: ['cyber', 'securite', 'hacking', 'protection', 'vulnerabilite', 'risque'],
    domains: ['reseaux-systemes'],
    levels: ['dts', 'licence'],
    href: '/formations/cybersecurite',
  },
  {
    title: 'Télécommunications',
    department: 'Télécommunications',
    description: 'Maîtriser les réseaux, les systèmes embarqués, l’IoT et les services numériques.',
    keywords: ['reseau', 'telecom', 'telecommunication', 'iot', 'internet', 'systeme embarque', 'infrastructure'],
    domains: ['reseaux-systemes'],
    levels: ['dts', 'licence'],
    href: '/formations/telecoms',
  },
  {
    title: 'Management des TIC',
    department: 'Management & TIC',
    description: 'Développer des compétences en marketing digital, commerce TIC et gestion de projet.',
    keywords: ['management', 'marketing', 'commerce', 'digital', 'e-commerce', 'entreprise', 'gestion'],
    domains: ['management-tic'],
    levels: ['dts', 'licence'],
    href: '/formations',
  },
  {
    title: 'Audiovisuel et multimédia',
    department: 'Multimédia & Internet',
    description: 'Créer des contenus en image, son, montage, réalisation et production.',
    keywords: ['audiovisuel', 'image', 'son', 'video', 'montage', 'infographie', 'creation'],
    domains: ['audiovisuel'],
    levels: ['dts', 'licence'],
    href: '/formations',
  },
  {
    title: 'Postes & Logistique',
    department: 'Management & TIC',
    description: 'Piloter les opérations, les flux, la planification et la chaîne logistique.',
    keywords: ['logistique', 'poste', 'stock', 'flux', 'transport', 'planification', 'supply chain'],
    domains: ['management-tic'],
    levels: ['dts', 'licence'],
    href: '/formations/postes-logistique',
  },
  {
    title: 'Licence Professionnelle Réseaux et Télécommunications',
    department: 'Réseaux et Systèmes Numériques',
    description: 'Concevoir, administrer et maintenir des réseaux et infrastructures de télécommunication.',
    keywords: ['reseau', 'telecommunication', 'telecom', 'infrastructure', 'administration reseau'],
    domains: ['reseaux-systemes'],
    levels: ['licence'],
    href: '/formations/telecoms',
  },
  {
    title: 'Licence Professionnelle Administration et Sécurité des Réseaux',
    department: 'Réseaux et Systèmes Numériques',
    description: 'Administrer les réseaux et renforcer la sécurité des infrastructures numériques.',
    keywords: ['reseau', 'securite', 'administration', 'infrastructure', 'cyber'],
    domains: ['reseaux-systemes'],
    levels: ['licence'],
    href: '/formations/cybersecurite',
  },
  {
    title: 'Licence Professionnelle Développement d’Applications Réparties',
    department: 'Réseaux et Systèmes Numériques',
    description: 'Développer des applications distribuées, des API et des services connectés.',
    keywords: ['application', 'repartie', 'developpement', 'api', 'logiciel', 'programmation'],
    domains: ['reseaux-systemes'],
    levels: ['licence'],
    href: '/formations/genie-logiciel',
  },
  {
    title: 'Licence Professionnelle Administration de Systèmes et de Bases de Données',
    department: 'Réseaux et Systèmes Numériques',
    description: 'Administrer les systèmes informatiques et les bases de données des organisations.',
    keywords: ['systeme', 'base de donnees', 'donnees', 'administration', 'serveur'],
    domains: ['reseaux-systemes'],
    levels: ['licence'],
    href: '/formations',
  },
  {
    title: 'Licence Professionnelle E-commerce & Marketing Digital',
    department: 'Management des TIC',
    description: 'Développer une activité commerciale en ligne et piloter une stratégie marketing digitale.',
    keywords: ['e-commerce', 'marketing', 'commerce', 'digital', 'vente', 'communication'],
    domains: ['management-tic'],
    levels: ['licence'],
    href: '/formations',
  },
  {
    title: 'Licence Professionnelle Techniques de Commercialisation des TIC',
    department: 'Management des TIC',
    description: 'Commercialiser des solutions technologiques et accompagner la transformation numérique.',
    keywords: ['commercialisation', 'commerce', 'tic', 'vente', 'marketing', 'commercial'],
    domains: ['management-tic'],
    levels: ['licence'],
    href: '/formations',
  },
  {
    title: 'Licence Professionnelle en Son',
    department: 'Audiovisuel',
    description: 'Développer des compétences techniques dans la prise de son et la production audio.',
    keywords: ['son', 'audio', 'audiovisuel', 'production'],
    domains: ['audiovisuel'],
    levels: ['licence'],
    href: '/formations',
  },
  {
    title: 'Licence Professionnelle en Image et Montage',
    department: 'Audiovisuel',
    description: 'Créer et monter des contenus visuels pour des projets audiovisuels et numériques.',
    keywords: ['image', 'montage', 'video', 'audiovisuel', 'creation'],
    domains: ['audiovisuel'],
    levels: ['licence'],
    href: '/formations',
  },
  {
    title: 'Internet des Objets (IoT) et réseaux de capteurs',
    department: 'Formation qualifiante',
    description: 'Concevoir des objets connectés et exploiter des réseaux de capteurs.',
    keywords: ['iot', 'objet', 'connecte', 'capteur', 'reseau'],
    domains: ['qualifiante'],
    levels: ['dts', 'licence'],
    href: '/formations/telecoms',
  },
  {
    title: 'Développement Web',
    department: 'Formation qualifiante',
    description: 'Concevoir, déployer et maintenir des applications web modernes.',
    keywords: ['web', 'site', 'frontend', 'backend', 'application', 'code'],
    domains: ['qualifiante'],
    levels: ['dts', 'licence'],
    href: '/formations/genie-logiciel',
  },
  {
    title: 'Intelligence Artificielle',
    department: 'Formation qualifiante et certifiante',
    description: 'Explorer l’analyse de données, la modélisation et l’automatisation intelligente.',
    keywords: ['intelligence artificielle', 'ia', 'machine learning', 'donnees', 'automatisation'],
    domains: ['qualifiante', 'certifiante'],
    levels: ['dts', 'licence'],
    href: '/formations',
  },
  {
    title: 'Big Data',
    department: 'Certification',
    description: 'Collecter, analyser et exploiter des volumes importants de données.',
    keywords: ['big data', 'donnees', 'data', 'analyse'],
    domains: ['certifiante'],
    levels: ['dts', 'licence'],
    href: '/formations',
  },
  {
    title: 'Cloud Computing',
    department: 'Certification',
    description: 'Administrer, migrer et sécuriser des services et infrastructures cloud.',
    keywords: ['cloud', 'serveur', 'infrastructure', 'migration'],
    domains: ['certifiante'],
    levels: ['dts', 'licence'],
    href: '/formations',
  },
];

function normalizeSearchValue(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function findFormationMatches(query: string, domain: string, level: string) {
  const normalizedQuery = normalizeSearchValue(query.trim());
  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

  return formationRecommendations
    .map((formation) => {
      const keywordMatches = formation.keywords.filter((keyword) => {
        const normalizedKeyword = normalizeSearchValue(keyword);
        return normalizedQuery.includes(normalizedKeyword) || queryWords.some((word) => normalizedKeyword.includes(word) || word.includes(normalizedKeyword));
      }).length;
      const domainMatch = domain && formation.domains.includes(domain) ? 4 : 0;
      const levelMatch = level && formation.levels.includes(level) ? 1 : 0;
      const score = keywordMatches * 3 + domainMatch + levelMatch;

      return { formation, score };
    })
    .sort((first, second) => second.score - first.score)
    .slice(0, 3)
    .map(({ formation, score }) => ({
      ...formation,
      score: Math.min(98, Math.max(62, 62 + score * 6)),
    }));
}

export default function Hero() {
  const [searchFocus, setSearchFocus] = useState(false);
  const [selectedAction, setSelectedAction] = useState('Visite 3D');
  const [formationQuery, setFormationQuery] = useState('');
  const [formationDomain, setFormationDomain] = useState('');
  const [formationLevel, setFormationLevel] = useState('');
  const [formationMatches, setFormationMatches] = useState<ReturnType<typeof findFormationMatches>>([]);
  const [showFormationResults, setShowFormationResults] = useState(false);

  return (
    <section className="relative min-h-[500px] bg-slate-900 overflow-hidden sm:min-h-[540px] md:min-h-[510px]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="hero-slider-track flex h-full w-max">
          {sliderImages.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="relative h-full w-screen shrink-0"
              style={{
                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.38), rgba(15, 23, 42, 0.38)), url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'saturate(1.05) contrast(1.02)',
              }}
            />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/55 via-slate-950/45 to-slate-950/55" />

      <div className="container-x relative grid items-center gap-8 py-12 text-white px-3 sm:px-4 md:py-28 md:px-0 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="space-y-4">
            <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Bienvenue à l'INPTIC Gabon
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-blue-100 sm:text-lg md:text-xl">
              Rejoignez la première université du numérique au Gabon et façonnez votre avenir dans les technologies de l'information.
            </p>
          </div>

          <a
            href="/formations"
            className="icon-only-mobile mt-4 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-6 py-3 font-semibold transition-all duration-200 hover:bg-blue-700 active:bg-blue-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:w-auto md:mt-8 md:px-8 md:py-4"
            role="button"
            aria-label="Découvrir nos formations"
          >
            <span className="btn-label">Découvrir nos formations</span>
            <ArrowRight size={20} aria-hidden="true" className="icon-slot transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:ml-auto">
        <div className={`formation-finder-panel w-full rounded-2xl p-5 shadow-lg transition-all duration-300 sm:p-6 md:p-8 ${
          searchFocus ? 'ring-2 ring-blue-400 shadow-2xl' : ''
        } ${showFormationResults ? 'formation-finder-exit' : 'formation-finder-return'}`}>
          <h2 className="mb-6 text-2xl font-bold md:text-3xl">Trouver ma formation</h2>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setFormationMatches(findFormationMatches(formationQuery, formationDomain, formationLevel));
              setFormationQuery('');
              setFormationDomain('');
              setFormationLevel('');
              setShowFormationResults(true);
            }}
          >
            <div className="relative">
              <input
                type="search"
                value={formationQuery}
                onChange={(event) => setFormationQuery(event.target.value)}
                className="w-full rounded-lg p-3 text-base text-slate-800 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 md:p-4"
                placeholder="Que voulez-vous étudier ?"
                aria-label="Champ de recherche de formation"
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
              />
              <Search size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            </div>

            <select
              className="w-full appearance-none rounded-lg bg-white p-3 text-base text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 md:p-4"
              aria-label="Domaine d'étude"
              value={formationDomain}
              onChange={(event) => setFormationDomain(event.target.value)}
            >
              <option value="">Domaine d'étude</option>
              <option value="management-tic">Management des TIC</option>
              <option value="reseaux-systemes">Réseaux et Systèmes Numériques</option>
              <option value="audiovisuel">Audiovisuel</option>
              <option value="qualifiante">Formations qualifiantes</option>
              <option value="certifiante">Formations certifiantes</option>
            </select>

            <select
              className="w-full appearance-none rounded-lg bg-white p-3 text-base text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 md:p-4"
              aria-label="Niveau d'études"
              value={formationLevel}
              onChange={(event) => setFormationLevel(event.target.value)}
            >
              <option value="">Niveau</option>
              <option value="dts">DTS</option>
              <option value="licence">Licence</option>
            </select>

            <button
              type="submit"
              className="icon-only-mobile flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 hover:shadow-lg active:scale-95 md:py-4"
              aria-label="Lancer la recherche de formations"
            >
              <span className="btn-label">Rechercher</span>
              <Search size={18} aria-hidden="true" className="icon-slot" />
            </button>

          </form>

          <p className="mt-4 text-sm leading-relaxed text-blue-100">
            💡 Conseil: Affinez votre recherche en sélectionnant un domaine et un niveau d'études.
          </p>
        </div>

          {showFormationResults && formationMatches.length > 0 && (
            <div className="formation-results-enter absolute inset-0 z-30 rounded-2xl border border-white/30 bg-slate-950 p-4 shadow-2xl sm:p-5" aria-live="polite">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Résultat de votre recherche</p>
                  <h3 className="mt-1 text-lg font-bold text-white">Formations recommandées</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFormationResults(false)}
                  className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  aria-label="Fermer les recommandations"
                  title="Fermer les recommandations"
                >
                  <X size={20} aria-hidden="true" />
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
                        <p className="font-bold">{match.title}</p>
                        <p className="text-xs text-slate-600">{match.department}</p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-blue-700">{match.score}%</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{match.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Buttons - Desktop */}
      <div className="absolute right-5 bottom-20 hidden xl:flex flex-col gap-3 bg-slate-900/55 backdrop-blur-sm p-4 rounded-xl text-xs text-center space-y-4 animate-in fade-in slide-in-from-right-8 duration-1000 border border-white/10">
        {quickActions.map(({ label, icon: Icon, ariaLabel }) => {
          const isSelected = selectedAction === label;

              return label === 'Visite 3D' || label === 'Candidature' || label === 'Alumni' ? (
              <Link
                key={label}
                  href={
                    label === 'Visite 3D'
                      ? '/visite-3d'
                      : label === 'Alumni'
                        ? '/alumni'
                        : '/admissions/depot'
                  }
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/70 ${
                  isSelected
                    ? 'bg-[#D4AF37]/20 text-[#F4D06F] ring-1 ring-[#D4AF37]/70 shadow-[0_0_0_1px_rgba(212,175,55,0.7)]'
                    : 'text-white hover:bg-white/10'
                }`}
                aria-label={ariaLabel}
              >
                <Icon size={20} aria-hidden="true" className={isSelected ? 'text-[#F4D06F]' : 'text-white'} />
                <span className={`font-semibold ${isSelected ? 'text-[#F4D06F]' : 'text-white'}`}>{label}</span>
              </Link>
            ) : (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setSelectedAction(label);
                  if (label === 'INPTIC-Bot') {
                    window.dispatchEvent(new Event('open-inptic-chat'));
                  }
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/70 ${
                  isSelected
                    ? 'bg-[#D4AF37]/20 text-[#F4D06F] ring-1 ring-[#D4AF37]/70 shadow-[0_0_0_1px_rgba(212,175,55,0.7)]'
                    : 'text-white hover:bg-white/10'
                }`}
                aria-label={ariaLabel}
              >
                <Icon size={20} aria-hidden="true" className={isSelected ? 'text-[#F4D06F]' : 'text-white'} />
                <span className={`font-semibold ${isSelected ? 'text-[#F4D06F]' : 'text-white'}`}>{label}</span>
              </button>
            );
        })}
      </div>

      {/* Scroll Indicator - Mobile */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:hidden flex flex-col items-center gap-2 text-white/60 animate-bounce">
        <span className="text-xs font-medium">Parcourez</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
