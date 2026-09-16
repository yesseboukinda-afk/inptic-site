'use client';

import PressNewsFeed from '@/components/PressNewsFeed';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function Actualites() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="relative isolate overflow-hidden text-white">
          <img src="/banniere/1.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
          <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.88) 30%, rgba(15, 23, 42, 0.48) 50%, rgba(30, 136, 168, 0.16) 75%, rgba(30, 136, 168, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
          <h1 className="text-4xl font-black md:text-6xl">{t('public.newsTitle')}</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            {t('public.newsIntro')}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: t('home.innovationWeek'),
              label: t('public.event'),
              text: t('home.innovationText'),
              href: '/recherche/projets',
            },
            {
              title: t('home.alumniLaunch'),
              label: t('public.network'),
              text: t('home.alumniText'),
              href: '/alumni',
            },
            {
              title: t('home.researchers'),
              label: t('public.research'),
              text: t('home.researchersText'),
              href: '/recherche',
            },
          ].map((item) => (
            <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                {item.label}
              </span>
              <h2 className="mt-5 text-2xl font-bold text-slate-900">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              <Link href={item.href} className="mt-6 inline-flex font-semibold text-blue-700 transition hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                {t('public.newsLink')}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">{t('public.press')}</p>
          <h2 className="mt-3 text-2xl font-bold">{t('public.pressTitle')}</h2>
          <p className="mt-4 max-w-3xl text-slate-300 leading-7">
            {t('public.pressText')}
          </p>
          <PressNewsFeed />
        </div>
      </section>
    </main>
  );
}
