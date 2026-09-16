"use client";

import { useTranslation } from 'react-i18next';

export default function Presentation() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img
          src="/banniere/DGA.webp"
          alt=""
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.9) 28%, rgba(15, 23, 42, 0.58) 48%, rgba(30, 136, 168, 0.2) 72%, rgba(30, 136, 168, 0.05) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <div className="max-w-3xl">
            <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
            <h1 className="text-4xl font-black md:text-6xl">{t('presentation.title')}</h1>
            <p className="mt-5 text-lg text-slate-200">
              {t('presentation.intro')}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{t('presentation.identity')}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{t('presentation.future')}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {t('presentation.identityText')}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">{t('presentation.strengths')}</h3>
            <ul className="mt-6 space-y-4 text-slate-700">
              <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span><span>{t('presentation.market')}</span></li>
              <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span><span>{t('presentation.personalized')}</span></li>
              <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span><span>{t('presentation.approach')}</span></li>
              <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span><span>{t('presentation.international')}</span></li>
            </ul>

            <div className="mt-8">
              <a
                href="/institut/organigramme"
                className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                {t('presentation.orgChart')}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
