'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Code2, Cpu, Database, ExternalLink, Globe2, RefreshCw, Share2, Wifi } from 'lucide-react';
import ArticleEngagement from '@/components/ArticleEngagement';

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  domain: string;
  date: string;
  coverImage?: string;
};

type EngagementTotals = {
  likes: number;
  shares: number;
};

type ArticleEngagementTotals = EngagementTotals & {
  articleSlug: string;
};

const NEWS_DOMAINS = ['IA', 'Base de données', 'Développement', 'Réseaux'];

function getDomainIcon(domain: string) {
  if (domain === 'IA') return <Cpu size={15} className="text-cyan-800" aria-hidden="true" />;
  if (domain === 'Base de données') return <Database size={15} className="text-emerald-700" aria-hidden="true" />;
  if (domain === 'Développement') return <Code2 size={15} className="text-blue-700" aria-hidden="true" />;
  return <Wifi size={15} className="text-amber-700" aria-hidden="true" />;
}

export default function PressNewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [engagementByArticle, setEngagementByArticle] = useState<Record<string, EngagementTotals>>({});
  const [statisticsUnavailable, setStatisticsUnavailable] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadStatistics() {
      try {
        const response = await fetch('/api/news/engagement', { cache: 'no-store' });
        if (!response.ok) throw new Error('Statistiques indisponibles.');
        const payload = await response.json();
        if (!active) return;
        const articleTotals = Array.isArray(payload.data?.articles) ? payload.data.articles as ArticleEngagementTotals[] : [];
        setEngagementByArticle(Object.fromEntries(articleTotals.map((item) => [item.articleSlug, {
          likes: Number(item.likes) || 0,
          shares: Number(item.shares) || 0,
        }])));
        setStatisticsUnavailable(false);
      } catch {
        if (active) setStatisticsUnavailable(true);
      } finally {
        if (active) setStatisticsLoading(false);
      }
    }

    const refresh = () => void loadStatistics();
    void loadStatistics();
    window.addEventListener('inptic:article-engagement-updated', refresh);
    const interval = window.setInterval(refresh, 60_000);

    return () => {
      active = false;
      window.removeEventListener('inptic:article-engagement-updated', refresh);
      window.clearInterval(interval);
    };
  }, []);

  const domainStatistics = NEWS_DOMAINS.map((domain) => news
    .filter((item) => item.domain === domain)
    .reduce((totals, item) => {
      const articleStats = engagementByArticle[`tech-${item.id}`];
      return {
        likes: totals.likes + (articleStats?.likes || 0),
        shares: totals.shares + (articleStats?.shares || 0),
      };
    }, { likes: 0, shares: 0 }));

  useEffect(() => {
    let active = true;
    let hasLoaded = false;

    async function loadNews(silent = false) {
      if (silent) setRefreshing(true);
      try {
        const response = await fetch('/api/tech-veille', { cache: 'no-store' });
        if (!response.ok) throw new Error('Flux international indisponible.');
        const payload = await response.json();
        if (!active) return;
        const items = Array.isArray(payload.items) ? payload.items as NewsItem[] : [];
        setNews(items);
        setLoadError(items.length === 0);
      } catch {
        if (active && !hasLoaded) setLoadError(true);
      } finally {
        hasLoaded = true;
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void loadNews();
    const interval = window.setInterval(() => void loadNews(true), 30 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <header className="mb-7 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-bold uppercase text-cyan-800">Veille internationale · IT &amp; IA</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Actualités internationales</h2>
        </div>
        {refreshing && <RefreshCw size={16} className="animate-spin text-cyan-700" aria-label="Actualisation du flux" />}
      </header>

      <section aria-label="Statistiques des actualités internationales" className="mb-6 border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase text-cyan-800">Engagement du flux</p>
            <h3 className="mt-1 text-sm font-bold text-slate-900">Interactions des lecteurs</h3>
          </div>
          {statisticsUnavailable && <span className="text-[10px] text-slate-500">Statistiques temporairement indisponibles</span>}
        </div>
        <div className="mt-4 border border-slate-200">
          <div className="grid grid-cols-[minmax(0,1fr)_76px_94px] items-center gap-2 bg-slate-50 px-3 py-2 text-[9px] font-bold uppercase text-slate-500 sm:grid-cols-[minmax(0,1fr)_110px_130px] sm:px-4">
            <span>Domaine</span>
            <span className="flex items-center justify-end gap-1.5" aria-label="Likes">
              <img src="/partages/like.svg" alt="" className="h-3 w-3" />
              <span className="hidden sm:inline">Likes</span>
            </span>
            <span className="flex items-center justify-end gap-1" role="img" aria-label="Partages sur les réseaux et par e-mail" title="Partages sur les réseaux et par e-mail">
              <img src="/partages/whatsapp.svg" alt="" className="h-3 w-3" />
              <img src="/partages/facebook.svg" alt="" className="h-3 w-3" />
              <img src="/partages/linkedin.svg" alt="" className="h-3 w-3" />
              <img src="/partages/youtube.svg" alt="" className="h-3 w-3" />
              <img src="/partages/mail-send.svg" alt="" className="h-3 w-3" />
            </span>
          </div>
          {NEWS_DOMAINS.map((domain, index) => (
            <div key={domain} className={`grid grid-cols-[minmax(0,1fr)_76px_94px] items-center gap-2 px-3 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_110px_130px] sm:px-4 ${index < NEWS_DOMAINS.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-800">{getDomainIcon(domain)}<span className="truncate">{domain}</span></span>
              <span className="text-right font-bold tabular-nums text-slate-900" aria-live="polite">
                {statisticsLoading ? '—' : statisticsUnavailable ? '—' : domainStatistics[index].likes.toLocaleString('fr-FR')}
              </span>
              <span className="text-right font-bold tabular-nums text-slate-900" aria-live="polite">
                {statisticsLoading ? '—' : statisticsUnavailable ? '—' : domainStatistics[index].shares.toLocaleString('fr-FR')}
              </span>
            </div>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Chargement des actualités internationales">
          {[1, 2, 3].map((item) => <div key={item} className="aspect-[4/3] animate-pulse bg-slate-100" />)}
        </div>
      ) : loadError && news.length === 0 ? (
        <div role="status" className="flex items-center gap-2 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle size={18} aria-hidden="true" /> Le flux d’actualités internationales est momentanément indisponible.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {news.map((item) => (
            <article id={item.id} key={item.id} className="group flex min-w-0 flex-col border border-slate-200 bg-white transition hover:border-cyan-700 hover:shadow-md">
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                {item.coverImage ? (
                  <img src={item.coverImage} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                ) : (
                  <div className="grid h-full place-items-center text-cyan-800"><Globe2 size={32} aria-hidden="true" /></div>
                )}
                <span className="absolute bottom-3 left-3 bg-slate-950/85 px-2.5 py-1 text-[10px] font-bold uppercase text-white">{item.domain}</span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-[10px] font-medium text-slate-500">{item.date} · {item.source}</p>
                <h3 className="mt-2 line-clamp-2 text-base font-bold leading-5 text-slate-950">{item.title}</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-xs leading-5 text-slate-600">{item.summary}</p>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-semibold text-cyan-800 hover:text-cyan-950">
                  Lire la source <ExternalLink size={13} aria-hidden="true" />
                </a>
                <ArticleEngagement
                  articleSlug={`tech-${item.id}`}
                  title={item.title}
                  sharePath={`/actualites#${encodeURIComponent(item.id)}`}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
