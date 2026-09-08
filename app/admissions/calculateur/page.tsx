'use client';

import { FormEvent, useState } from 'react';

type ProgramType = 'licence' | 'qualifiante' | 'certifiante';
type StudyLevel = 'bac' | 'bac2' | 'bac3' | 'autre';
type BacType = 'A' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'autre';
type Specialty = 'sciences' | 'informatique' | 'gestion' | 'communication' | 'technique' | 'autre';

type Track = {
  name: string;
  department: string;
  programType: ProgramType;
  minimumLevel: StudyLevel;
  bacTypes: BacType[];
  specialties: Specialty[];
  criteria: string;
};

type Recommendation = Track & {
  score: number;
  reasons: string[];
};

const programLabels: Record<ProgramType, string> = {
  licence: 'Licence professionnelle',
  qualifiante: 'Formation qualifiante',
  certifiante: 'Formation certifiante',
};

const levelLabels: Record<StudyLevel, string> = {
  bac: 'Baccalauréat',
  bac2: 'Bac+2 ou équivalent',
  bac3: 'Bac+3 ou plus',
  autre: 'Autre niveau ou en cours de formation',
};

const bacLabels: Record<BacType, string> = {
  A: 'Bac A - Lettres et sciences humaines',
  C: 'Bac C - Mathématiques et sciences physiques',
  D: 'Bac D - Mathématiques et sciences de la vie',
  E: 'Bac E - Mathématiques et technique',
  F: 'Bac F - Technique industrielle',
  G: 'Bac G - Gestion et économie',
  H: 'Bac H - Techniques administratives',
  autre: 'Autre type de bac',
};

const specialtyLabels: Record<Specialty, string> = {
  sciences: 'Sciences et mathématiques',
  informatique: 'Informatique et numérique',
  gestion: 'Gestion, commerce et économie',
  communication: 'Lettres, communication et médias',
  technique: 'Électronique, réseaux et technique',
  autre: 'Autre spécialité',
};

const tracks: Track[] = [
  { name: 'Techniques de Commercialisation des TIC', department: 'Management des TIC', programType: 'licence', minimumLevel: 'bac2', bacTypes: ['A', 'G', 'H'], specialties: ['gestion', 'communication'], criteria: 'Bac+2 ou équivalent, avec un profil gestion, commerce ou communication.' },
  { name: 'E-commerce & Marketing Digital', department: 'Management des TIC', programType: 'licence', minimumLevel: 'bac2', bacTypes: ['A', 'G', 'H'], specialties: ['gestion', 'communication', 'informatique'], criteria: 'Bac+2 ou équivalent, avec un intérêt pour le commerce et les outils numériques.' },
  { name: 'Technologies de l’Information et de la Communication', department: 'Management des TIC', programType: 'licence', minimumLevel: 'bac2', bacTypes: ['A', 'C', 'D', 'G', 'H'], specialties: ['gestion', 'communication', 'informatique'], criteria: 'Bac+2 ou équivalent, avec une base en TIC, gestion ou communication.' },
  { name: 'Développement d’Applications Réparties', department: 'Réseaux et Systèmes Numériques', programType: 'licence', minimumLevel: 'bac2', bacTypes: ['C', 'D', 'E', 'F'], specialties: ['sciences', 'informatique', 'technique'], criteria: 'Bac+2 ou équivalent, avec un profil scientifique, informatique ou technique.' },
  { name: 'Administration de Systèmes et de Bases de Données', department: 'Réseaux et Systèmes Numériques', programType: 'licence', minimumLevel: 'bac2', bacTypes: ['C', 'D', 'E', 'F'], specialties: ['sciences', 'informatique', 'technique'], criteria: 'Bac+2 ou équivalent, avec des bases en systèmes, données ou informatique.' },
  { name: 'Réseaux et Télécommunications', department: 'Réseaux et Systèmes Numériques', programType: 'licence', minimumLevel: 'bac2', bacTypes: ['C', 'D', 'E', 'F'], specialties: ['sciences', 'informatique', 'technique'], criteria: 'Bac+2 ou équivalent, avec un profil scientifique ou technique.' },
  { name: 'Administration et Sécurité des Réseaux', department: 'Réseaux et Systèmes Numériques', programType: 'licence', minimumLevel: 'bac2', bacTypes: ['C', 'D', 'E', 'F'], specialties: ['sciences', 'informatique', 'technique'], criteria: 'Bac+2 ou équivalent, avec des bases en réseaux et sécurité.' },
  { name: 'Licence professionnelle en Son', department: 'Audiovisuel', programType: 'licence', minimumLevel: 'bac2', bacTypes: ['A', 'E', 'F', 'H'], specialties: ['communication', 'technique'], criteria: 'Bac+2 ou équivalent, avec un profil communication ou technique.' },
  { name: 'Licence professionnelle en Image', department: 'Audiovisuel', programType: 'licence', minimumLevel: 'bac2', bacTypes: ['A', 'E', 'F', 'H'], specialties: ['communication', 'technique'], criteria: 'Bac+2 ou équivalent, avec un intérêt pour l’image et la création.' },
  { name: 'Licence professionnelle en Montage', department: 'Audiovisuel', programType: 'licence', minimumLevel: 'bac2', bacTypes: ['A', 'E', 'F', 'H'], specialties: ['communication', 'informatique', 'technique'], criteria: 'Bac+2 ou équivalent, avec un profil communication, numérique ou technique.' },
  { name: 'Licence professionnelle Réalisation / Production / Script', department: 'Audiovisuel', programType: 'licence', minimumLevel: 'bac2', bacTypes: ['A', 'H'], specialties: ['communication'], criteria: 'Bac+2 ou équivalent, avec un profil communication, médias ou lettres.' },
  { name: 'Développement Web', department: 'Réseaux et Systèmes Numériques', programType: 'qualifiante', minimumLevel: 'bac', bacTypes: ['C', 'D', 'E', 'F'], specialties: ['sciences', 'informatique', 'technique'], criteria: 'Baccalauréat ou niveau équivalent, avec une appétence pour le numérique.' },
  { name: 'Marketing numérique', department: 'Management des TIC', programType: 'qualifiante', minimumLevel: 'bac', bacTypes: ['A', 'G', 'H'], specialties: ['gestion', 'communication'], criteria: 'Baccalauréat ou niveau équivalent, avec un profil gestion ou communication.' },
  { name: 'Infographie et montage vidéo', department: 'Audiovisuel', programType: 'qualifiante', minimumLevel: 'bac', bacTypes: ['A', 'E', 'F', 'H'], specialties: ['communication', 'informatique', 'technique'], criteria: 'Baccalauréat ou niveau équivalent, avec une sensibilité créative ou numérique.' },
  { name: 'Cybersécurité', department: 'Réseaux et Systèmes Numériques', programType: 'certifiante', minimumLevel: 'bac', bacTypes: ['C', 'D', 'E', 'F'], specialties: ['sciences', 'informatique', 'technique'], criteria: 'Baccalauréat ou niveau équivalent, avec un profil scientifique ou technique.' },
  { name: 'Intelligence Artificielle', department: 'Réseaux et Systèmes Numériques', programType: 'certifiante', minimumLevel: 'bac2', bacTypes: ['C', 'D', 'E'], specialties: ['sciences', 'informatique'], criteria: 'Bac+2 ou équivalent, avec des bases en sciences, données ou informatique.' },
];

const levelRank: Record<StudyLevel, number> = { autre: 0, bac: 1, bac2: 2, bac3: 3 };

export default function Calculateur() {
  const [programType, setProgramType] = useState<ProgramType | ''>('');
  const [studyLevel, setStudyLevel] = useState<StudyLevel | ''>('');
  const [bacType, setBacType] = useState<BacType | ''>('');
  const [specialty, setSpecialty] = useState<Specialty | ''>('');
  const [diploma, setDiploma] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);

  const calculateEligibility = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!programType || !studyLevel || !bacType || !specialty) return;

    const scoredTracks = tracks
      .filter((track) => track.programType === programType)
      .map((track) => {
        const hasRequiredLevel = levelRank[studyLevel] >= levelRank[track.minimumLevel];
        const matchesBac = track.bacTypes.includes(bacType);
        const matchesSpecialty = track.specialties.includes(specialty);
        const reasons: string[] = [];
        let score = 0;

        if (hasRequiredLevel) {
          score += 4;
          reasons.push(`Niveau compatible : ${levelLabels[studyLevel]}`);
        } else {
          reasons.push(`Niveau requis : ${levelLabels[track.minimumLevel]}`);
        }
        if (matchesBac) {
          score += 3;
          reasons.push(`Type de bac adapté : ${bacLabels[bacType]}`);
        }
        if (matchesSpecialty) {
          score += 3;
          reasons.push(`Spécialité cohérente : ${specialtyLabels[specialty]}`);
        }

        return { ...track, score, reasons };
      })
      .sort((firstTrack, secondTrack) => secondTrack.score - firstTrack.score);

    setRecommendations(scoredTracks.slice(0, 3));
  };

  const resetCalculator = () => {
    setProgramType('');
    setStudyLevel('');
    setBacType('');
    setSpecialty('');
    setDiploma('');
    setRecommendations(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img src="/banniere/2.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Admissions</p>
          <h1 className="text-4xl font-black md:text-6xl">Calculateur d’éligibilité</h1>
            <p className="mt-5 max-w-3xl text-lg text-blue-50">
            Identifiez la filière et le département les plus adaptés à votre bac, votre spécialité et votre niveau.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={calculateEligibility} className="rounded-none border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Simulation gratuite</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Vérifiez votre profil</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Renseignez votre profil pour obtenir un classement des filières compatibles.</p>
            </div>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Type de formation</span>
                <select
                  required
                  value={programType}
                  onChange={(event) => { setProgramType(event.target.value as ProgramType); setRecommendations(null); }}
                  className="w-full rounded-none border border-slate-200 bg-white p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Sélectionner une formation</option>
                  {(Object.keys(programLabels) as ProgramType[]).map((type) => <option key={type} value={type}>{programLabels[type]}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Type de bac</span>
                <select
                  required
                  value={bacType}
                  onChange={(event) => { setBacType(event.target.value as BacType); setRecommendations(null); }}
                  className="w-full rounded-none border border-slate-200 bg-white p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Sélectionner votre type de bac</option>
                  {(Object.keys(bacLabels) as BacType[]).map((type) => <option key={type} value={type}>{bacLabels[type]}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Dernier niveau validé</span>
                <select
                  required
                  value={studyLevel}
                  onChange={(event) => { setStudyLevel(event.target.value as StudyLevel); setRecommendations(null); }}
                  className="w-full rounded-none border border-slate-200 bg-white p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Sélectionner votre niveau</option>
                  {(Object.keys(levelLabels) as StudyLevel[]).map((level) => <option key={level} value={level}>{levelLabels[level]}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Spécificité de votre parcours</span>
                <select
                  required
                  value={specialty}
                  onChange={(event) => { setSpecialty(event.target.value as Specialty); setRecommendations(null); }}
                  className="w-full rounded-none border border-slate-200 bg-white p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Sélectionner une spécialité</option>
                  {(Object.keys(specialtyLabels) as Specialty[]).map((value) => <option key={value} value={value}>{specialtyLabels[value]}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Diplôme ou spécialité</span>
                <input
                  value={diploma}
                  onChange={(event) => setDiploma(event.target.value)}
                  placeholder="Ex. : Bac D, BTS, DUT, Licence..."
                  className="w-full rounded-none border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button type="submit" className="rounded-none bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Vérifier mon éligibilité
              </button>
              <button type="button" onClick={resetCalculator} className="rounded-none border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Réinitialiser
              </button>
            </div>
          </form>

          <div className="rounded-none border border-slate-200 bg-white p-6 shadow-sm md:p-8" aria-live="polite">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Résultat</p>
            {recommendations === null ? (
              <div className="mt-8 rounded-none bg-slate-50 p-6 text-sm leading-6 text-slate-600">
                Votre classement apparaîtra ici après validation du formulaire.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {recommendations.map((recommendation, index) => (
                  <div key={recommendation.name} className={`rounded-none border p-5 ${index === 0 ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600">{index === 0 ? 'Meilleure correspondance' : `Option ${index + 1}`}</p>
                        <h3 className="mt-1 font-bold text-slate-900">{recommendation.name}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-600">Département : {recommendation.department}</p>
                      </div>
                      <span className="shrink-0 rounded-none bg-white px-3 py-1 text-sm font-bold text-blue-700 shadow-sm">{recommendation.score}/10</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{recommendation.criteria}</p>
                    <ul className="mt-3 space-y-1 text-xs text-slate-600">
                      {recommendation.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
                    </ul>
                  </div>
                ))}
                {recommendations[0]?.score < 7 && <p className="rounded-none bg-amber-50 p-4 text-sm leading-6 text-amber-900">Aucune correspondance ne remplit tous les critères indicatifs. Contactez l’administration pour étudier votre parcours.</p>}
              </div>
            )}
            <p className="mt-6 text-xs leading-5 text-slate-500">Cette simulation est indicative et ne remplace pas l’étude officielle de votre dossier par l’administration.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
