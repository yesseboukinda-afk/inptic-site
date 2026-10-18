'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import AdmissionJourneyNavigation from '@/components/AdmissionJourneyNavigation';

export default function Admissions() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img src="/banniere/2.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
          <h1 className="text-4xl font-black md:text-6xl">{t('public.admissionsTitle')}</h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-50">
            {t('public.admissionsIntro')}
          </p>
        </div>
      </section>

      <section className="py-8">
        <AdmissionJourneyNavigation current="guide" />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              title: '1. Lire le guide d’admission',
              text: 'Comprenez les étapes, les pièces à préparer, la validation préalable et les frais avant de commencer.',
              href: '/admissions/guide',
              action: 'Ouvrir le guide',
            },
            {
              title: '2. Consulter les concours',
              text: 'Vérifiez la session publiée, ses dates, les conditions officielles et les résultats disponibles.',
              href: '/concours',
              action: 'Voir les concours',
            },
            {
              title: '3. Créer votre dossier candidat',
              text: 'Activez votre compte, préinscrivez-vous à la session ouverte, puis déposez vos pièces et votre formulaire.',
              href: '/admissions/depot',
              action: 'Accéder au dépôt',
            },
            {
              title: '4. Suivre votre candidature',
              text: 'Consultez l’étape en cours, les corrections demandées, la confirmation du paiement et les décisions.',
              href: '/admissions/suivi',
              action: 'Ouvrir le suivi',
            },
          ].map((item) => (
            <article key={item.title} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{item.text}</p>
              <Link href={item.href} className="mt-5 inline-flex w-fit items-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800">
                {item.action}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-8 md:px-8">
        <div className="rounded-3xl bg-slate-900 px-6 py-10 text-white md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-blue-200">{t('public.stayInformed')}</p>
              <h3 className="mt-2 text-3xl font-bold">{t('public.applyToday')}</h3>
            </div>
            <Link href="/admissions/guide" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500">
              Lire le guide d’admission
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
