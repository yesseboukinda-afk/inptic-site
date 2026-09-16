 'use client';

import { useTranslation } from 'react-i18next';

export default function ConditionsUtilisationPage() {
  const { t } = useTranslation();
  const paragraphs = ['acceptance', 'purpose', 'prohibited', 'accuracy', 'externalLinks', 'availability'];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-16 text-slate-800">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">INPTIC</p>
        <h1 className="mt-4 text-3xl font-black md:text-4xl">{t('public.terms.title')}</h1>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700 md:text-base">
          {paragraphs.map((key) => <p key={key}>{t(`public.terms.${key}`)}</p>)}
        </div>
      </div>
    </main>
  );
}
