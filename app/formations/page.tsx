'use client';

import { useState } from 'react';

const departmentCards = [
  {
    title: 'Management des TIC',
    items: [
      'Licence Professionnelle Techniques de Commercialisation des TIC',
      'Licence Professionnelle E-commerce & Marketing Digital',
      'Licence Professionnelle Technologies de l’Information et de la Communication (TIC)',
    ],
    debouches: [
      'Chargé de marketing digital',
      'Chef de projet digital',
      'Commercial TIC / conseiller en transformation numérique',
      'Gestionnaire de e-commerce et CRM',
      'Analyste business / gestion de projets IT',
    ],
  },
  {
    title: 'Réseaux et Systèmes Numériques',
    items: [
      'Licence Professionnelle Développement d’Applications Réparties',
      'Licence Professionnelle Administration de Systèmes et de Bases de Données',
      'Licence Professionnelle Réseaux et Télécommunications',
      'Licence Professionnelle Administration et Sécurité des Réseaux',
    ],
    debouches: [
      'Administrateur système et réseaux',
      'Spécialiste support infrastructure numérique',
      'Administrateur de bases de données',
      'Consultant réseau et cybersécurité',
      'Développeur d’applications réparties',
    ],
  },
  {
    title: 'Audiovisuel',
    items: [
      'Licence Professionnelle en Son',
      'Licence Professionnelle en Image',
      'Licence Professionnelle en Montage',
      'Licence Professionnelle Réalisation / Production / Script',
    ],
    debouches: [
      'Assistant réalisateur / réalisateur junior',
      'Monteur vidéo',
      'Chef opérateur / cadreur',
      'Technicien son / spécialiste audio',
      'Producteur audiovisuel / gestion de contenu multimédia',
    ],
  },
];

const qualifyingCards = [
  'Internet des Objets (IoT) et réseaux de capteurs',
  'Cybersécurité et protection des infrastructures télécoms',
  'Formation à l’usage des TIC',
  'Infographie et montage vidéo',
  'Marketing numérique',
  'Cybersécurité',
  'Intelligence Artificielle',
  'Développement Web',
  'Journaliste Reporter d’Images (JRI)',
];

const certifyingCards = [
  'Intelligence Artificielle',
  'Internet des Objets (AET/IoT)',
  'Big Data',
  'Cybersécurité',
  'Cloud Computing',
];

type SelectedCard = {
  title: string;
  summary: string;
  debouches: string[];
  items?: string[];
};

const modalContent = {
  'Management des TIC': {
    title: 'Management des TIC',
    summary: 'Des profils orientés gestion, marketing, commerce et transformation digitale.',
    debouches: [
      'Chargé de marketing digital',
      'Chef de projet transformation numérique',
      'Commercial TIC / gestionnaire de comptes',
      'Responsable e-commerce et CRM',
      'Consultant en innovation digitale',
    ],
  },
  'Réseaux et Systèmes Numériques': {
    title: 'Réseaux et Systèmes Numériques',
    summary: 'Des compétences techniques dans les systèmes, les données, les réseaux et la cybersécurité.',
    debouches: [
      'Administrateur système et réseau',
      'Spécialiste support infrastructure',
      'Analyste sécurité informatique',
      'Administrateur de bases de données',
      'Développeur applications réparties',
    ],
  },
  'Audiovisuel': {
    title: 'Audiovisuel',
    summary: 'Des métiers liés à la création audiovisuelle, à l’image, au son et à la production.',
    debouches: [
      'Monteur vidéo',
      'Cadreur / chef opérateur',
      'Assistant réalisateur',
      'Technicien du son',
      'Producteur audiovisuel et gestionnaire de contenu',
    ],
  },
  'Internet des Objets (IoT) et réseaux de capteurs': {
    title: 'Internet des Objets (IoT)',
    summary: 'Formation orientée vers les objets connectés, la collecte de données et les réseaux intelligents.',
    debouches: [
      'Technicien IoT',
      'Intégrateur systèmes connectés',
      'Gestionnaire de réseaux de capteurs',
      'Technicien maintenance domotique et industriel',
    ],
  },
  'Cybersécurité et protection des infrastructures télécoms': {
    title: 'Cybersécurité et infrastructures télécoms',
    summary: 'Des compétences de protection des réseaux, infrastructures et services numériques.',
    debouches: [
      'Analyste cybersécurité',
      'Administrateur sécurité réseau',
      'Expert protection des infrastructures',
      'Technicien sécurité des systèmes d’information',
    ],
  },
  'Formation à l’usage des TIC': {
    title: 'Formation à l’usage des TIC',
    summary: 'Une spécialisation axée sur la maîtrise des outils numériques et l’usage efficace des TIC.',
    debouches: [
      'Assistante de gestion numérique',
      'Gestionnaire de contenus numériques',
      'Support utilisateur informatique',
      'Agent de digitalisation de services',
    ],
  },
  'Infographie et montage vidéo': {
    title: 'Infographie et montage vidéo',
    summary: 'Des métiers liés au design, à la création visuelle et à la production de contenus numériques.',
    debouches: [
      'Designer graphique',
      'Monteur vidéo',
      'Motion designer',
      'Créateur de contenus visuels',
    ],
  },
  'Marketing numérique': {
    title: 'Marketing numérique',
    summary: 'Des compétences en communication digitale, réseaux sociaux, SEO et gestion de campagnes.',
    debouches: [
      'Community manager',
      'Chargé de marketing digital',
      'Gestionnaire de contenu digital',
      'Consultant marketing numérique',
    ],
  },
  'Cybersécurité': {
    title: 'Cybersécurité',
    summary: 'Une spécialisation sur la protection des systèmes, réseaux et données numériques.',
    debouches: [
      'Analyste en sécurité informatique',
      'Hacker éthique / pentester junior',
      'Technicien sécurité des SI',
      'Responsable conformité sécurité',
    ],
  },
  'Intelligence Artificielle': {
    title: 'Intelligence Artificielle',
    summary: 'Des compétences en IA, analyse de données et automatisation des tâches intelligentes.',
    debouches: [
      'Data analyst',
      'Spécialiste IA / machine learning',
      'Analyste de données',
      'Automatisation de processus intelligents',
    ],
  },
  'Développement Web': {
    title: 'Développement Web',
    summary: 'Une spécialisation pour concevoir, déployer et maintenir des applications web modernes.',
    debouches: [
      'Développeur web frontend',
      'Développeur backend',
      'Full stack junior',
      'Intégrateur web',
    ],
  },
  'Journaliste Reporter d’Images (JRI)': {
    title: 'Journaliste Reporter d’Images (JRI)',
    summary: 'Des compétences en réalisation, prise de vue et reportage visuel.',
    debouches: [
      'Reporter photo / vidéaste',
      'Journaliste d’image',
      'Rédacteur multimédia',
      'Chargé de production documentaire',
    ],
  },
  'Intelligence Artificielle certif': {
    title: 'Intelligence Artificielle',
    summary: 'Certification orientée vers l’analyse de données, la modélisation et l’automatisation.',
    debouches: [
      'Data scientist junior',
      'Spécialiste IA',
      'Analyste de données',
      'Spécialiste automatisation intelligente',
    ],
  },
  'Internet des Objets (AET/IoT)': {
    title: 'Internet des Objets (AET/IoT)',
    summary: 'Certification sur les objets connectés et la gestion intelligente des réseaux.',
    debouches: [
      'Technicien IoT',
      'Spécialiste systèmes connectés',
      'Responsable maintenance équipements connectés',
      'Intégrateur réseaux de capteurs',
    ],
  },
  'Big Data': {
    title: 'Big Data',
    summary: 'Des compétences sur la collecte, l’analyse et l’exploitation des données massives.',
    debouches: [
      'Data analyst',
      'Data engineer junior',
      'Chargé d’analyse de données',
      'Gestionnaire de données d’entreprise',
    ],
  },
  'Cloud Computing': {
    title: 'Cloud Computing',
    summary: 'Des compétences en migration, administration et sécurisation des services cloud.',
    debouches: [
      'Administrateur cloud',
      'Technicien infrastructure cloud',
      'Consultant migration cloud',
      'Support infra-as-a-service',
    ],
  },
};

export default function Formations() {
  const [selected, setSelected] = useState<SelectedCard | null>(null);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img src="/banniere/6.webp" alt="" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
                    <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />

          <h1 className="text-4xl font-black md:text-6xl">Formations initiale (3 ans)</h1>
          <p className="mt-5 max-w-3xl text-lg text-blue-50">
            L’INPTIC propose aujourd’hui trois grands départements de formation initiale, conçus pour préparer les profils du numérique aux enjeux du marché.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {departmentCards.map((card) => (
            <article key={card.title} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900">{card.title}</h2>
              <ul className="mt-5 space-y-3 text-slate-700">
                {card.items.map((item) => (
                  <li key={item} className="rounded-xl bg-slate-50 p-3">{item}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setSelected({
                  title: card.title,
                  summary: modalContent[card.title as keyof typeof modalContent]?.summary ?? 'Formation proposée par l’INPTIC.',
                  debouches: modalContent[card.title as keyof typeof modalContent]?.debouches ?? card.debouches,
                  items: card.items,
                })}
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                En savoir plus
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <h2 className="text-3xl font-black text-slate-900">Formations qualifiantes</h2>
          <p className="mt-4 text-lg text-slate-600">Le catalogue officiel liste notamment :</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {qualifyingCards.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700 shadow-sm">
                <div className="min-h-[72px]">{item}</div>
                <button
                  type="button"
                  onClick={() => setSelected(modalContent[item as keyof typeof modalContent] ?? { title: item, summary: 'Formation proposée par l’INPTIC.', debouches: ['Formation spécialisée', 'Insertion professionnelle', 'Mise à niveau des compétences'] })}
                  className="mt-4 inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:text-blue-800"
                >
                  En savoir plus
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <h2 className="text-3xl font-black text-slate-900">Formations certifiantes</h2>
          <p className="mt-4 text-lg text-slate-600">
            L’INPTIC indique également des certifications professionnelles dans les domaines suivants :
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {certifyingCards.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <div className="font-semibold text-slate-700">{item}</div>
                <button
                  type="button"
                  onClick={() => setSelected(modalContent[item === 'Intelligence Artificielle' ? 'Intelligence Artificielle certif' : item === 'Cloud Computing' ? 'Cloud Computing' : item === 'Internet des Objets (AET/IoT)' ? 'Internet des Objets (AET/IoT)' : item === 'Big Data' ? 'Big Data' : 'Cybersécurité'])}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:text-blue-800"
                >
                  En savoir plus
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Débouchés métiers</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">{selected.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Fermer
              </button>
            </div>

            <p className="mt-4 text-slate-600">{selected.summary ?? 'Formation proposée par l’INPTIC, avec un fort potentiel de débouchés dans le numérique.'}</p>

            <ul className="mt-6 space-y-3">
              {selected.debouches?.map((item) => (
                <li key={item} className="rounded-xl bg-slate-50 p-3 text-slate-700">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
