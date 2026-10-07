'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

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

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{t('public.whyChoose')}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{t('public.admissionHeading')}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {t('public.admissionText')}
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {t('public.admissionText2')}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">{t('public.steps')}</h3>
            <ul className="mt-6 space-y-5 text-slate-700">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">1</span>
                <div>
                  <p className="font-semibold text-slate-900">{t('public.guide')}</p>
                  <p className="text-sm text-slate-600">{t('public.guideText')}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">2</span>
                <div>
                  <p className="font-semibold text-slate-900">{t('public.eligibility')}</p>
                  <p className="text-sm text-slate-600">{t('public.eligibilityText')}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">3</span>
                <div>
                  <p className="font-semibold text-slate-900">{t('public.submit')}</p>
                  <p className="text-sm text-slate-600">{t('public.submitText')}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">4</span>
                <div>
                  <p className="font-semibold text-slate-900">{t('public.tracking')}</p>
                  <p className="text-sm text-slate-600">{t('public.trackingText')}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{t('public.offers')}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{t('public.applyHeading')}</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              { title: t('public.guide'), text: t('public.guideText') },
              { title: t('public.eligibility'), text: t('public.eligibilityText') },
              { title: t('public.submit'), text: t('public.submitText') },
              { title: t('public.tracking'), text: t('public.trackingText') },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="mb-4 h-12 w-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-xl font-black text-blue-700">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-8 md:px-8">
        <div className="rounded-3xl bg-slate-900 px-6 py-10 text-white md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-blue-200">{t('public.stayInformed')}</p>
              <h3 className="mt-2 text-3xl font-bold">{t('public.applyToday')}</h3>
            </div>
            <Link href="/concours" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500">
              {t('public.submitMine')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
