'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, CircleHelp, FileCheck2, Mail, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdmissionJourneyNavigation from '@/components/AdmissionJourneyNavigation';

const admissionSteps = [
  {
    number: '01',
    title: 'Créer votre compte candidat',
    text: 'Créez votre compte depuis la page de connexion/inscription avec votre nom, votre adresse e-mail et un mot de passe.',
  },
  {
    number: '02',
    title: 'Attendre l’ouverture des préinscriptions',
    text: 'Votre compte est utilisable dès sa création, sans confirmation par e-mail. La préinscription devient possible lorsque l’administration ouvre une session de concours.',
  },
  {
    number: '03',
    title: 'Utiliser la session sélectionnée automatiquement',
    text: 'Dès qu’une session est ouverte, le site la sélectionne automatiquement. Vous n’avez pas à choisir le concours dans une liste : consultez simplement ses dates et ses conditions.',
  },
  {
    number: '04',
    title: 'Se préinscrire',
    text: 'Connectez-vous à votre compte puis cliquez sur « Me préinscrire ». Votre compte est automatiquement rattaché à la session ouverte. Cette étape est obligatoire avant le dépôt.',
  },
  {
    number: '05',
    title: 'Déposer le dossier de candidature complet',
    text: 'Transmettez l’acte de naissance ou la CNI, le baccalauréat ou justificatif de scolarité en Terminale et le relevé de notes officiel, puis complétez le formulaire officiel dans la même étape (filières choisies, identité, coordonnées, cursus et contact d’urgence). Vous pouvez enregistrer le formulaire pendant que la Scolarité vérifie les pièces et peut demander une correction. Après validation des pièces, envoyez le dossier complet. Ces sous-étapes constituent un seul dépôt et doivent être terminées pour atteindre 100 %.',
  },
  {
    number: '06',
    title: 'Régler les frais de dossier — dernière étape',
    text: 'Le paiement de 20 000 FCFA par Airtel Money ou Moov Money se débloque uniquement lorsque le dossier est complet à 100 % : préinscription enregistrée, pièces validées et formulaire officiel envoyé. Validez ensuite la demande sur votre téléphone.',
  },
];

const documents = [
  'Acte de naissance ou pièce d’identité nationale (CNI).',
  'Copie du baccalauréat, attestation de réussite ou certificat de scolarité en classe de Terminale.',
  'Relevé de notes officiel.',
];

export default function GuideAdmission() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img src="/banniere/2.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">{t('header.admissions')}</p>
          <h1 className="text-4xl font-black md:text-6xl">{t('header.guideAdmission')}</h1>
          <p className="mt-5 max-w-3xl text-lg text-blue-50">
            Les étapes à suivre pour vous inscrire à un concours de l’INPTIC, faire vérifier votre dossier, régler les frais et suivre son traitement jusqu’aux résultats.
          </p>
          <Link href="/concours" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 hover:bg-blue-50">
            Consulter les concours <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <div className="py-8">
        <AdmissionJourneyNavigation />
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-8 md:px-8">
        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <CircleHelp size={23} className="mt-0.5 shrink-0 text-blue-700" />
            <div>
              <h2 className="text-lg font-black text-slate-900">Avant de commencer</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Votre compte est activé immédiatement, sans validation de l’adresse e-mail. Les dates d’ouverture, de clôture et des épreuves sont celles publiées par l’administration sur la fiche de la session. Une préinscription n’est possible que pendant la période ouverte. Préparez des fichiers lisibles et utilisez une adresse e-mail valide pour recevoir les informations relatives à votre dossier.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Parcours candidat</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">Les six étapes de l’inscription</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Le dépôt est l’étape 5. Le paiement est l’étape 6 et ne s’ouvre qu’après la complétion du dossier à 100 %. Après le paiement, utilisez la page Suivi pour consulter l’examen final et les résultats.
          </p>
        </div>
        <ol className="space-y-4">
          {admissionSteps.map((step) => (
            <li key={step.number} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:gap-6 sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-sm font-black text-white">{step.number}</span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-2 md:px-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <FileCheck2 size={22} className="text-blue-700" />
              <h2 className="text-xl font-black">Pièces à préparer</h2>
            </div>
            <ul className="mt-5 space-y-3">
              {documents.map((document) => (
                <li key={document} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                  <CheckCircle2 size={17} className="mt-1 shrink-0 text-emerald-600" />
                  <span>{document}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Les justificatifs doivent être lisibles, complets et correspondre à la catégorie demandée. La Scolarité peut demander un remplacement si une pièce est illisible ou non conforme.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <ShieldCheck size={22} className="text-emerald-700" />
              <h2 className="text-xl font-black">Comprendre les statuts</h2>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
              <li><strong>À effectuer :</strong> une étape n’a pas encore été commencée.</li>
              <li><strong>En cours :</strong> l’action est enregistrée et attend le candidat, le paiement ou la Scolarité.</li>
              <li><strong>Correction demandée :</strong> lisez le commentaire, corrigez les pièces et transmettez-les à nouveau.</li>
              <li><strong>Terminé :</strong> l’étape a été enregistrée ou validée.</li>
            </ul>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              La page Suivi actualise les informations régulièrement pendant qu’elle est ouverte. Les décisions de la Scolarité et la confirmation du paiement y apparaissent après leur enregistrement.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <div className="rounded-3xl bg-slate-950 p-6 text-white sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Mail size={22} className="mt-1 shrink-0 text-cyan-300" />
              <div>
                <h2 className="text-xl font-black">Besoin d’aide ?</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Consultez les dates et documents officiels de la session. Pour un problème de compte ou de dossier, contactez la Scolarité en précisant l’adresse e-mail de votre compte candidat.
                </p>
              </div>
            </div>
            <Link href="/concours" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-blue-500">
              Voir le concours et les résultats <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
