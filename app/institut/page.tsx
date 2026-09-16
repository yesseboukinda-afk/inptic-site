"use client";

import { useTranslation } from 'react-i18next';

export default function Institut() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img
          src="/banniere/DG.webp"
          alt=""
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-1/2 scale-105 object-cover object-center brightness-110 saturate-110"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(7, 25, 55, 0.96) 0%, rgba(7, 25, 55, 0.72) 38%, rgba(0, 142, 174, 0.28) 70%, rgba(0, 142, 174, 0.08) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <div className="max-w-3xl">
            <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
            <h1 className="text-4xl font-black md:text-6xl">{t('institute.title')}</h1>
            <p className="mt-5 text-lg text-slate-200">
              {t('institute.intro')}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{t('institute.about')}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{t('institute.aboutTitle')}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {t('institute.aboutText')}
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {t('institute.missionText')}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">{t('institute.missionTitle')}</h3>
            <p className="mt-5 leading-7 text-slate-600">
              {t('institute.missionText')}
            </p>
            <div className="mt-8 rounded-2xl bg-blue-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">{t('institute.directorMessage')}</p>
              <blockquote className="mt-4 text-lg leading-8 text-slate-800">
                « {t('institute.quote')} »
              </blockquote>
              <p className="mt-3 font-semibold text-slate-900">Landry BADIALI</p>
              <p className="text-sm text-slate-600">{t('institute.director')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{t('institute.strengths')}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{t('institute.strengthsTitle')}</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
              {[
              { title: t('institute.personalized'), text: t('institute.personalizedText') },
              { title: t('institute.certifications'), text: t('institute.certificationsText') },
              { title: t('institute.international'), text: t('institute.internationalText') },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-7 shadow-sm">
                <div className="mb-4 h-12 w-12 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center text-xl font-black">✓</div>
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
