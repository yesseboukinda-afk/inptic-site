'use client';

import PressNewsFeed from '@/components/PressNewsFeed';
import { useTranslation } from 'react-i18next';

export default function Actualites() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="relative isolate overflow-hidden text-white">
          <img src="/banniere/page-actualites.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
          <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.88) 30%, rgba(15, 23, 42, 0.48) 50%, rgba(30, 136, 168, 0.16) 75%, rgba(30, 136, 168, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <img src="/logoinptic.ico" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
          <h1 className="text-4xl font-black md:text-6xl">{t('public.newsTitle')}</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            {t('public.newsIntro')}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-screen-xl px-4 py-12 md:px-8 md:py-16">
        <PressNewsFeed />
      </section>
    </main>
  );
}
