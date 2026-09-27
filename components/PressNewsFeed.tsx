'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type NewsItem = {
  id: string;
  slug: string;
  title: string;
  text: string;
  date?: string;
};

const fallbackNews: NewsItem[] = [
  {
    id: 'innovation',
    slug: 'innovation',
    title: 'Semaine de l’innovation 2025',
    text: 'Conférences, ateliers et hackathons autour des technologies émergentes.',
  },
  {
    id: 'alumni',
    slug: 'alumni',
    title: 'Lancement de la plateforme INPTIC Alumni',
    text: 'Un nouveau réseau pour réunir diplômés, étudiants et partenaires.',
  },
  {
    id: 'recherche',
    slug: 'recherche',
    title: 'Nos chercheurs présentent leurs travaux',
    text: 'Les projets de l’Institut en IA, cybersécurité et transformation numérique.',
  },
];

const getNewsItems = (payload: unknown): NewsItem[] => {
  const entries = Array.isArray(payload)
    ? payload
    : typeof payload === 'object' && payload !== null && Array.isArray((payload as { data?: unknown[] }).data)
      ? (payload as { data: unknown[] }).data
      : [];

  return entries.slice(0, 20).map((entry, index) => {
    const item = (entry as { attributes?: Record<string, unknown> } & Record<string, unknown>).attributes || entry as Record<string, unknown>;
    const id = String((entry as { documentId?: string; id?: string | number }).documentId || (entry as { id?: string | number }).id || index);
    return {
      id,
      slug: String(item.slug || id),
      title: String(item.title || item.titre || 'Actualité INPTIC'),
      text: String(item.excerpt || item.description || item.resume || item.content || ''),
      date: typeof item.publishedAt === 'string' ? item.publishedAt : undefined,
    };
  }).filter((item) => item.title && item.text);
};

export default function PressNewsFeed() {
  const { t, i18n } = useTranslation();
  const localizedFallbackNews: NewsItem[] = [
    { id: 'innovation', slug: 'innovation', title: t('newsFeed.innovationTitle'), text: t('newsFeed.innovationText') },
    { id: 'alumni', slug: 'alumni', title: t('newsFeed.alumniTitle'), text: t('newsFeed.alumniText') },
    { id: 'recherche', slug: 'recherche', title: t('newsFeed.researchTitle'), text: t('newsFeed.researchText') },
  ];
  const [news, setNews] = useState<NewsItem[]>(localizedFallbackNews);

  useEffect(() => {
    setNews((current) => current.every((item) => ['innovation', 'alumni', 'recherche'].includes(item.id)) ? localizedFallbackNews : current);
  }, [i18n.language]);

  useEffect(() => {
    let active = true;

    fetch('/api/news')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('News unavailable'))))
      .then((payload) => {
        const remoteNews = getNewsItems(payload);
        if (active && remoteNews.length) setNews(remoteNews);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">{t('newsFeed.label')}</p>
      <div className="mt-4 space-y-4">
        {news.map((item) => (
          <article id={item.slug} key={item.id} className="scroll-mt-24 border-b border-white/10 pb-4 last:border-0 last:pb-0">
            {item.date && <p className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : i18n.language === 'ar' ? 'ar' : i18n.language === 'en' ? 'en-GB' : 'fr-FR')}</p>}
            <h4 className="mt-1 font-semibold text-white">{item.title}</h4>
            <p className="mt-1 text-sm leading-6 text-slate-300">{item.text}</p>
          </article>
        ))}
      </div>
      <Link href="/actualites" className="mt-5 inline-flex text-sm font-semibold text-blue-200 transition hover:text-white">
        {t('newsFeed.allNews')}
      </Link>
    </div>
  );
}
