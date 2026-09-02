'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type NewsItem = {
  id: string;
  title: string;
  text: string;
  date?: string;
};

const fallbackNews: NewsItem[] = [
  {
    id: 'innovation',
    title: 'Semaine de l’innovation 2025',
    text: 'Conférences, ateliers et hackathons autour des technologies émergentes.',
  },
  {
    id: 'alumni',
    title: 'Lancement de la plateforme INPTIC Alumni',
    text: 'Un nouveau réseau pour réunir diplômés, étudiants et partenaires.',
  },
  {
    id: 'recherche',
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

  return entries.slice(0, 3).map((entry, index) => {
    const item = (entry as { attributes?: Record<string, unknown> } & Record<string, unknown>).attributes || entry as Record<string, unknown>;
    return {
      id: String((entry as { id?: string | number }).id || index),
      title: String(item.title || item.titre || 'Actualité INPTIC'),
      text: String(item.excerpt || item.description || item.resume || item.content || ''),
      date: typeof item.publishedAt === 'string' ? item.publishedAt : undefined,
    };
  }).filter((item) => item.title && item.text);
};

export default function PressNewsFeed() {
  const [news, setNews] = useState<NewsItem[]>(fallbackNews);

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
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Flux d’actualités</p>
      <div className="mt-4 space-y-4">
        {news.map((item) => (
          <article key={item.id} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
            {item.date && <p className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString('fr-FR')}</p>}
            <h4 className="mt-1 font-semibold text-white">{item.title}</h4>
            <p className="mt-1 text-sm leading-6 text-slate-300">{item.text}</p>
          </article>
        ))}
      </div>
      <Link href="/actualites" className="mt-5 inline-flex text-sm font-semibold text-blue-200 transition hover:text-white">
        Voir toutes les actualités →
      </Link>
    </div>
  );
}
