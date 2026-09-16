 'use client';

import { useTranslation } from 'react-i18next';

export default function TextesEtLoisPage() {
  const { t } = useTranslation();
  const creationPurposes = ['skills', 'professionals', 'innovation', 'publicServices', 'education'];
  const legalReferences = ['higherEducation', 'digitalDevelopment', 'publicInstitutions', 'instituteManagement', 'academicPrograms'];
  const missions = ['training', 'capacity', 'publicSupport', 'partnerships', 'research'];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-16 text-slate-800">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">INPTIC</p>
        <h1 className="mt-4 text-3xl font-black md:text-4xl">{t('public.legalTexts.title')}</h1>

        <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700 md:text-base">
          <section className="space-y-4">
            <p>{t('public.legalTexts.intro1')}</p>
            <p>{t('public.legalTexts.intro2')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">{t('public.legalTexts.frameworkTitle')}</h2>
            <p>{t('public.legalTexts.framework1')}</p>
            <p>{t('public.legalTexts.framework2')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">{t('public.legalTexts.actsTitle')}</h2>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <ul className="space-y-3">
                {['lawEducation', 'orderInstitutions', 'lawTechnology', 'orderGovernance', 'decreeOrganization'].map((key) => <li key={key}><strong>{t(`public.legalTexts.${key}`)}</strong></li>)}
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">{t('public.legalTexts.purposeTitle')}</h2>
            <p>{t('public.legalTexts.purposeIntro')}</p>
            <ul className="list-disc space-y-2 pl-6">{creationPurposes.map((key) => <li key={key}>{t(`public.legalTexts.purpose${key}`)}</li>)}</ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">{t('public.legalTexts.referencesTitle')}</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <ul className="divide-y divide-slate-200 bg-white text-slate-700">
                {legalReferences.map((key) => <li key={key} className="p-4">- {t(`public.legalTexts.reference${key}`)}</li>)}
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">{t('public.legalTexts.principlesTitle')}</h2>
            <p>{t('public.legalTexts.principles1')}</p>
            <p>{t('public.legalTexts.principles2')}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">{t('public.legalTexts.missionTitle')}</h2>
            <p>{t('public.legalTexts.missionIntro')}</p>
            <ul className="list-disc space-y-2 pl-6">{missions.map((key) => <li key={key}>{t(`public.legalTexts.mission${key}`)}</li>)}</ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">{t('public.legalTexts.conclusionTitle')}</h2>
            <p>{t('public.legalTexts.conclusion1')}</p>
            <p>{t('public.legalTexts.conclusion2')}</p>
          </section>
        </div>
      </div>
    </main>
  );
}
