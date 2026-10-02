'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Code2, Cpu, Database, ExternalLink, Globe2, RefreshCw, Wifi } from 'lucide-react';
import ArticleEngagement from '@/components/ArticleEngagement';
import { supabase } from '@/lib/supabase';
import { isAdminAccountEmail, isAdminRole } from '@/lib/roles';

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

type ArticleStats = {
  articleSlug:     string;
  likes:           number;
  shares:          number;
  shares_whatsapp: number;
  shares_facebook: number;
  shares_linkedin: number;
  shares_youtube:  number;
  shares_mail:     number;
  shares_tiktok:   number;
};

type DomainStats = Omit<ArticleStats, 'articleSlug'>;

const ZERO_STATS: DomainStats = { likes: 0, shares: 0, shares_whatsapp: 0, shares_facebook: 0, shares_linkedin: 0, shares_youtube: 0, shares_mail: 0, shares_tiktok: 0 };

const NEWS_DOMAINS = ['IA', 'Base de données', 'Développement', 'Réseaux'];

function getDomainIcon(domain: string) {
  if (domain === 'IA') return <Cpu size={15} className="text-cyan-800" aria-hidden="true" />;
  if (domain === 'Base de données') return <Database size={15} className="text-emerald-700" aria-hidden="true" />;
  if (domain === 'Développement') return <Code2 size={15} className="text-blue-700" aria-hidden="true" />;
  return <Wifi size={15} className="text-amber-700" aria-hidden="true" />;
}

function N({ v, loading, unavailable }: { v: number; loading: boolean; unavailable: boolean }) {
  if (loading || unavailable) return <span className="text-slate-400">—</span>;
  return <>{v > 0 ? v.toLocaleString('fr-FR') : <span className="text-slate-300">0</span>}</>;
}

export default function PressNewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [statsByArticle, setStatsByArticle] = useState<Record<string, ArticleStats>>({});
  const [statisticsUnavailable, setStatisticsUnavailable] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      const email = user.email;
      const role = (user.user_metadata?.role ?? user.app_metadata?.role) as unknown;
      setIsAdmin(isAdminAccountEmail(email) || isAdminRole(role));
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function loadStatistics() {
      try {
        const response = await fetch('/api/news/engagement', { cache: 'no-store' });
        if (!response.ok) throw new Error('Statistiques indisponibles.');
        const payload = await response.json();
        if (!active) return;
        const articles: ArticleStats[] = Array.isArray(payload.data?.articles) ? payload.data.articles : [];
        setStatsByArticle(Object.fromEntries(articles.map((a) => [a.articleSlug, a])));
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

  const domainStats: DomainStats[] = NEWS_DOMAINS.map((domain) =>
    news
      .filter((item) => item.domain === domain)
      .reduce<DomainStats>((acc, item) => {
        const s = statsByArticle[`tech-${item.id}`];
        if (!s) return acc;
        return {
          likes:           acc.likes           + s.likes,
          shares:          acc.shares          + s.shares,
          shares_whatsapp: acc.shares_whatsapp + s.shares_whatsapp,
          shares_facebook: acc.shares_facebook + s.shares_facebook,
          shares_linkedin: acc.shares_linkedin + s.shares_linkedin,
          shares_youtube:  acc.shares_youtube  + s.shares_youtube,
          shares_mail:     acc.shares_mail     + s.shares_mail,
          shares_tiktok:   acc.shares_tiktok   + (s.shares_tiktok ?? 0),
        };
      }, { ...ZERO_STATS }),
  );

  // Totaux globaux
  const globalStats = domainStats.reduce<DomainStats>((acc, d) => ({
    likes:           acc.likes           + d.likes,
    shares:          acc.shares          + d.shares,
    shares_whatsapp: acc.shares_whatsapp + d.shares_whatsapp,
    shares_facebook: acc.shares_facebook + d.shares_facebook,
    shares_linkedin: acc.shares_linkedin + d.shares_linkedin,
    shares_youtube:  acc.shares_youtube  + d.shares_youtube,
    shares_mail:     acc.shares_mail     + d.shares_mail,
    shares_tiktok:   acc.shares_tiktok   + d.shares_tiktok,
  }), { ...ZERO_STATS });

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
    return () => { active = false; window.clearInterval(interval); };
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

      {isAdmin && (
        <section aria-label="Tableau de statistiques d'engagement" className="mb-8 border border-slate-200 bg-white">
          {/* En-tête */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase text-cyan-800">Administration · Statistiques</p>
              <h3 className="mt-0.5 text-sm font-bold text-slate-900">Engagement par domaine et par réseau</h3>
            </div>
            {statisticsUnavailable && (
              <span className="text-[10px] text-amber-600">Statistiques temporairement indisponibles</span>
            )}
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-[9px] font-bold uppercase text-slate-500">
                  <th className="px-4 py-2.5 text-left">Domaine</th>
                  <th className="px-3 py-2.5 text-right">
                    <span className="flex items-center justify-end gap-1">
                      <img src="/partages/like.svg" alt="" className="h-3 w-3" />
                      Likes
                    </span>
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    <span className="flex items-center justify-end gap-1">
                      <img src="/partages/whatsapp.svg" alt="" className="h-3 w-3" />
                      WhatsApp
                    </span>
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    <span className="flex items-center justify-end gap-1">
                      <img src="/partages/facebook.svg" alt="" className="h-3 w-3" />
                      Facebook
                    </span>
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    <span className="flex items-center justify-end gap-1">
                      <img src="/partages/linkedin.svg" alt="" className="h-3 w-3" />
                      LinkedIn
                    </span>
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    <span className="flex items-center justify-end gap-1">
                      <img src="/partages/youtube.svg" alt="" className="h-3 w-3" />
                      YouTube
                    </span>
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    <span className="flex items-center justify-end gap-1">
                      <img src="/partages/mail-send.svg" alt="" className="h-3 w-3" />
                      E-mail
                    </span>
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    <span className="flex items-center justify-end gap-1">
                      <img src="/partages/tiktok.svg" alt="" className="h-3 w-3" />
                      TikTok
                    </span>
                  </th>
                  <th className="px-3 py-2.5 text-right text-slate-700">Total partages</th>
                </tr>
              </thead>
              <tbody>
                {NEWS_DOMAINS.map((domain, i) => {
                  const d = domainStats[i];
                  return (
                    <tr key={domain} className="border-b border-slate-100 tabular-nums transition hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-2 font-semibold text-slate-800">
                          {getDomainIcon(domain)}
                          <span className="truncate">{domain}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-rose-700">
                        <N v={d.likes} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                        <N v={d.shares_whatsapp} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-blue-700">
                        <N v={d.shares_facebook} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-sky-700">
                        <N v={d.shares_linkedin} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-red-600">
                        <N v={d.shares_youtube} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-600">
                        <N v={d.shares_mail} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                        <N v={d.shares_tiktok} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                        <N v={d.shares} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Ligne totaux */}
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 text-xs font-black text-slate-900">
                  <td className="px-4 py-2.5 uppercase tracking-wide text-slate-600">Total</td>
                  <td className="px-3 py-2.5 text-right text-rose-700">
                    <N v={globalStats.likes} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                  </td>
                  <td className="px-3 py-2.5 text-right text-emerald-700">
                    <N v={globalStats.shares_whatsapp} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                  </td>
                  <td className="px-3 py-2.5 text-right text-blue-700">
                    <N v={globalStats.shares_facebook} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                  </td>
                  <td className="px-3 py-2.5 text-right text-sky-700">
                    <N v={globalStats.shares_linkedin} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                  </td>
                  <td className="px-3 py-2.5 text-right text-red-600">
                    <N v={globalStats.shares_youtube} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-700">
                    <N v={globalStats.shares_mail} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-900">
                    <N v={globalStats.shares_tiktok} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-900">
                    <N v={globalStats.shares} loading={statisticsLoading} unavailable={statisticsUnavailable} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Chargement des actualités internationales">
          {[1, 2, 3].map((item) => <div key={item} className="aspect-[4/3] animate-pulse bg-slate-100" />)}
        </div>
      ) : loadError && news.length === 0 ? (
        <div role="status" className="flex items-center gap-2 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle size={18} aria-hidden="true" /> Le flux d'actualités internationales est momentanément indisponible.
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
