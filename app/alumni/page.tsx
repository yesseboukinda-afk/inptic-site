'use client';

import { useTranslation } from 'react-i18next';

export default function Alumni() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img
          src="/banniere/1.webp"
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
              'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <img src="/logoinptic.png" alt="Logo INPTIC" className="h-9 w-auto object-contain object-left" />
          <h1 className="mt-3 max-w-3xl text-4xl font-black md:text-6xl">{t('pages.alumni')}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            {t('pages.alumniIntro')}
          </p>
        </div>
      </section>

      <nav className="border-b border-slate-200 bg-white" aria-label={t('pages.alumni')}>
        <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-4 text-sm font-semibold text-slate-600 md:px-8">
          <a href="#rejoindre" className="whitespace-nowrap transition hover:text-blue-600">{t('pages.joinNetwork')}</a>
          <a href="#services" className="whitespace-nowrap transition hover:text-blue-600">{t('pages.services')}</a>
          <a href="#evenements" className="whitespace-nowrap transition hover:text-blue-600">{t('pages.events')}</a>
          <a href="#contact-alumni" className="whitespace-nowrap transition hover:text-blue-600">{t('pages.contact')}</a>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['01', t('pages.community'), t('pages.communityText')],
            ['02', t('pages.opportunities'), t('pages.opportunitiesText')],
            ['03', t('pages.commitment'), t('pages.commitmentText')],
          ].map(([number, title, text]) => (
            <div key={number} className="border-l-4 border-cyan-500 bg-white p-6 shadow-sm">
              <p className="text-sm font-black text-cyan-600">{number}</p>
              <h2 className="mt-2 text-lg font-bold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div id="services" className="mb-10 max-w-2xl scroll-mt-24">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{t('pages.network')}</p>
          <h2 className="mt-3 text-3xl font-black text-slate-900">{t('pages.networkTitle')}</h2>
          <p className="mt-4 leading-7 text-slate-600">{t('pages.networkText')}</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: t('pages.keepContact'), text: t('pages.keepContactText'),
            },
            {
              title: t('pages.shareOpportunities'), text: t('pages.shareOpportunitiesText'),
            },
            {
              title: t('pages.supportStudents'), text: t('pages.supportStudentsText'),
            },
          ].map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="rejoindre" className="bg-slate-900 text-white scroll-mt-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1fr_0.8fr] md:items-center md:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">{t('pages.joinAlumni')}</p>
            <h2 className="mt-3 text-3xl font-black">{t('pages.shareJourney')}</h2>
            <p className="mt-5 max-w-xl leading-7 text-slate-300">{t('pages.shareJourneyText')}</p>
          </div>
          <div className="bg-white p-7 text-slate-900 shadow-xl">
            <h3 className="text-xl font-bold">{t('pages.nextStep')}</h3>
            <ol className="mt-5 space-y-4 text-sm text-slate-600">
              <li><strong className="text-slate-900">1. {t('pages.stepContact')}</strong><br />{t('pages.stepContactText')}</li>
              <li><strong className="text-slate-900">2. {t('pages.stepShare')}</strong><br />{t('pages.stepShareText')}</li>
              <li><strong className="text-slate-900">3. {t('pages.stepBuild')}</strong><br />{t('pages.stepBuildText')}</li>
            </ol>
            <a href="/contact" className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">{t('pages.contactAlumni')}</a>
          </div>
        </div>
      </section>

      <section id="evenements" className="bg-white scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{t('pages.networkLife')}</p>
          <h2 className="mt-3 text-3xl font-black text-slate-900">{t('pages.meetings')}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              [t('pages.professionalMeetings'), t('pages.professionalMeetingsText')],
              [t('pages.mentoring'), t('pages.mentoringText')],
              [t('pages.testimonials'), t('pages.testimonialsText')],
            ].map(([title, text]) => (
              <article key={title} className="border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact-alumni" className="bg-slate-50 scroll-mt-24">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center md:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{t('pages.activeCommunity')}</p>
          <h2 className="mt-3 text-3xl font-black text-slate-900">{t('pages.journeyContinues')}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">{t('pages.journeyContinuesText')}</p>
          <a href="/contact" className="mt-8 inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">{t('pages.contactInptic')}</a>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center md:px-8">
          <p className="text-sm text-slate-600">{t('pages.latestText')}</p>
          <a href="/actualites" className="mt-3 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
            {t('pages.allNews')}
          </a>
        </div>
      </section>
    </main>
  );
}
