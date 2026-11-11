'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type SearchItem = {
  id: number | string;
  title: string;
  description: string;
  category: string;
  href: string;
};

type SearchResults = {
  items: SearchItem[];
  partial?: boolean;
  unavailableSources?: string[];
};

export default function Recherche() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchWarning, setSearchWarning] = useState('');

  useEffect(() => {
    const currentQuery = new URLSearchParams(window.location.search).get('q')?.trim() || '';
    setQuery(currentQuery);

    if (!currentQuery) {
      setResults(null);
      return;
    }

    let active = true;
    setIsLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(currentQuery)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'La recherche est momentanément indisponible.');
        }
        return data;
      })
      .then((data: SearchResults) => {
        if (active) {
          setResults(data);
          setSearchError('');
          setSearchWarning(data.partial
            ? 'Certains contenus ne sont pas disponibles pour le moment. Les autres sources ont été recherchées.'
            : '');
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setResults(null);
          setSearchWarning('');
          setSearchError(error instanceof Error ? error.message : 'La recherche est momentanément indisponible.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img src="/banniere/page-recherche.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
                    <img src="/logoinptic.ico" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />

          <h1 className="text-4xl font-black md:text-6xl">{t('public.researchTitle')}</h1>
          <p className="mt-5 max-w-3xl text-lg text-blue-50">
            {t('public.researchIntro')}
          </p>
        </div>
      </section>

      {query && (
        <section className="mx-auto max-w-6xl px-4 py-10 md:px-8" aria-live="polite">
          <h2 className="text-2xl font-black text-slate-900">{t('public.resultsFor', { query })}</h2>
          {isLoading ? (
            <p className="mt-4 text-slate-600">{t('public.searching')}</p>
          ) : searchError ? (
            <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
              {searchError}
            </p>
          ) : (
            <div className="mt-6">
              {searchWarning && (
                <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {searchWarning}
                </p>
              )}
              {results?.items.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {results.items.map((item) => (
                    <Link key={item.id} href={item.href} className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:shadow-sm">
                      <span className="mb-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{item.category}</span>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      {item.description && <p className="mt-1 line-clamp-3 text-sm text-slate-600">{item.description}</p>}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-600">{t('public.noResults')}</p>
              )}
            </div>
          )}
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{t('public.approach')}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{t('public.approachHeading')}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {t('public.approachText')}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">{t('public.axes')}</h3>
            <ul className="mt-6 space-y-5 text-slate-700">
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>{t('public.labs')}</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>{t('public.studentProjects')}</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>{t('public.startup')}</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>{t('public.academicPartners')}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{t('public.examples')}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{t('public.ideas')}</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: t('public.aiData'), text: t('public.aiDataText') },
              { title: t('public.embedded'), text: t('public.embeddedText') },
              { title: t('public.startups'), text: t('public.startupsText') },
            ].map((project) => (
              <article key={project.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm">
                <div className="mb-4 h-12 w-12 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center text-xl font-black">✦</div>
                <h3 className="text-xl font-bold text-slate-900">{project.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{project.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center md:px-8">
          <p className="text-sm text-slate-600">{t('public.latest')}</p>
          <Link href="/actualites" className="mt-3 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
            {t('public.allNews')}
          </Link>
        </div>
      </section>
    </main>
  );
}
