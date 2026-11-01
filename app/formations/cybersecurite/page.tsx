 'use client';

import { useTranslation } from 'react-i18next';

export default function Cybersecurite() {
  const { t } = useTranslation();
  const items = ['security', 'vulnerabilities', 'risks'];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img src="/banniere/6.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
        <img src="/logoinptic.ico" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
          <h1 className="text-4xl font-black md:text-6xl">{t('public.cyberTitle')}</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            {t('public.cyberIntro')}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900">{t(`public.cyber${item}Title`)}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t(`public.cyber${item}Text`)}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
