'use client';

import { useTranslation } from 'react-i18next';

const partnerLogos = [
  { name: 'CNOU', src: '/partners/cnou.png', url: 'https://www.cnou.ga/' },
  { name: 'Cisco', src: '/partners/cisco.png', url: 'https://www.cisco.com/' },
  { name: 'Moov Africa', src: '/partners/moov-africa.jpg', url: 'https://www.moov-africa.ga/' },
  { name: 'SPIN', src: '/partners/spin.png', url: 'https://spin.ga/' },
  { name: 'Comilog', src: '/partners/comilog.png', url: 'https://comilog.eramet.com/' },
  { name: 'Ministère', src: '/partners/minister.png', url: 'https://economie-numerique.gouv.ga/' },
  { name: 'ANBG', src: '/partners/anbg.png', url: 'https://anbg.online/' },
  { name: 'Arcep', src: '/partners/arcep.png', url: 'https://www.arcep.ga/' },
];

export default function Entreprises() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="relative isolate overflow-hidden text-white">
          <img src="/banniere/5.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
          <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
        <img src="/logoinptic.ico" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
          <h1 className="text-4xl font-black md:text-6xl">{t('public.companiesTitle')}</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            {t('public.companiesIntro')}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{t('public.professionalIntegration')}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{t('public.companiesHeading')}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {t('public.companiesText')}
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {t('public.companiesText2')}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">{t('public.services')}</h3>
            <ul className="mt-6 space-y-5 text-slate-700">
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>{t('public.recruitment')}</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>{t('public.internships')}</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>{t('public.continuing')}</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>{t('public.innovation')}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{t('public.partnerships')}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{t('public.partnersHeading')}</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {partnerLogos.map((partner) => (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visiter le site de ${partner.name} (nouvel onglet)`}
                className="flex min-h-[180px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <img
                  src={partner.src}
                  alt={partner.name}
                  className="max-h-20 w-full object-contain grayscale-[0.15]"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{t('public.figures')}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{t('public.results')}</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { value: '500+', label: t('public.students') },
              { value: '95%', label: t('public.employment') },
              { value: '15+', label: t('public.partners') },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
                <div className="text-4xl font-black text-blue-700">{stat.value}</div>
                <p className="mt-3 text-sm uppercase tracking-[0.14em] text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
