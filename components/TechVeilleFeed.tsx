'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Code,
  Cpu,
  Database,
  ExternalLink,
  Globe,
  Megaphone,
  RefreshCw,
  Sparkles,
  Wifi,
} from 'lucide-react';

type TechItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  domain: 'IA' | 'Base de données' | 'Développement' | 'Réseaux';
  date: string;
  coverImage?: string;
};

const INITIAL_TECH_NEWS: TechItem[] = [
  {
    id: '1',
    title: 'OpenAI annonce de nouvelles avancées en raisonnement IA et agents autonomes',
    summary: 'La recherche mondiale en intelligence artificielle franchit une nouvelle étape avec des modèles multimodaux.',
    source: 'Tech Community / AI News',
    url: 'https://dev.to',
    domain: 'IA',
    date: 'En direct',
    coverImage: '',
  },
];

function getSocialIcon(network: 'whatsapp' | 'facebook' | 'linkedin' | 'x') {
  if (network === 'whatsapp' || network === 'facebook' || network === 'linkedin') {
    return <img src={`/partages/${network}.svg`} alt="" className="h-4 w-4" />;
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.257 5.63 5.907-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
    </svg>
  );
}

export default function TechVeilleFeed({ accessToken }: { accessToken: string }) {
  const [news, setNews] = useState<TechItem[]>(INITIAL_TECH_NEWS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [selectedNetworks, setSelectedNetworks] = useState({
    whatsapp: true,
    facebook: true,
    linkedin: true,
    x: true,
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [publishError, setPublishError] = useState('');
  const [isFetchingLive, setIsFetchingLive] = useState(true);
  const [refreshError, setRefreshError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [feedSource, setFeedSource] = useState<'live' | 'fallback' | null>(null);
  const refreshInProgress = useRef(false);

  const loadLiveTechNews = async (forceRefresh = false) => {
    if (refreshInProgress.current) return;
    refreshInProgress.current = true;
    setIsFetchingLive(true);
    setRefreshError('');

    try {
      const res = await fetch(`/api/tech-veille${forceRefresh ? '?refresh=1' : ''}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Le flux de veille IT est momentanément indisponible.');

      const data = await res.json();
      if (!data?.success || !Array.isArray(data.items)) {
        throw new Error('La réponse du flux de veille IT est invalide.');
      }

      setNews(data.items.length > 0 ? data.items : INITIAL_TECH_NEWS);
      setCurrentIndex(0);
      setFeedSource(data.source === 'live' ? 'live' : 'fallback');
      setLastUpdated(new Date());
      if (data.source !== 'live') {
        setRefreshError(data.fallbackReason || 'Source IT indisponible; les dernières données de secours sont affichées.');
      }
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : 'Impossible d’actualiser la veille IT.');
    } finally {
      refreshInProgress.current = false;
      setIsFetchingLive(false);
    }
  };

  useEffect(() => {
    loadLiveTechNews();
    const interval = setInterval(() => {
      loadLiveTechNews();
    }, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (news.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [news.length]);

  const toggleNetwork = (net: keyof typeof selectedNetworks) => {
    setSelectedNetworks((prev) => ({ ...prev, [net]: !prev[net] }));
  };

  const handlePublishAndBroadcast = async (item: TechItem) => {
    if (!accessToken) {
      setPublishError('Votre session a expiré. Reconnectez-vous avant de publier.');
      return;
    }

    setPublishingId(item.id);
    setSuccessMsg('');
    setPublishError('');

    const coverLine = item.coverImage ? `\n\nImage de couverture : ${item.coverImage}` : '';
    const formattedPost = ` [VEILLE IT & IA - INPTIC GABON]\n\n${item.title}\n\n Résumé : ${item.summary}\n\n Source officielle : ${item.url}\n\n#INPTIC #Gabon #Tech #IA #Innovation #Digital${coverLine}`;
    const activeNetworks = (Object.keys(selectedNetworks) as (keyof typeof selectedNetworks)[])
      .filter((network) => selectedNetworks[network]);
    const shareWindows: Partial<Record<keyof typeof selectedNetworks, Window | null>> = {};

    // Open share windows in the click handler so browsers do not block them after the API request.
    for (const network of activeNetworks) {
      shareWindows[network] = window.open('about:blank', '_blank');
    }

    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: `[Veille IT] ${item.title}`,
          category: 'Annonce',
          excerpt: formattedPost,
          attachments: [],
          socialLinks: [{ label: 'Source originale', url: item.url }],
          targetPages: ['actualites'],
          status: 'published',
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'La publication sur le site a échoué.');

      const slug = result.data?.slug;
      if (!slug) throw new Error('La publication a été enregistrée, mais son lien public est introuvable.');
      const publicationUrl = `${window.location.origin}/actualites#${encodeURIComponent(item.id)}`;
      const shareText = `${formattedPost}\n\n${publicationUrl}`;
      try {
        await navigator.clipboard.writeText(shareText);
      } catch {
        // Clipboard access can be unavailable outside a secure context.
      }

      const shareUrls = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicationUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicationUrl)}`,
        x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(formattedPost)}&url=${encodeURIComponent(publicationUrl)}`,
      };
      const blockedNetworks: string[] = [];
      for (const network of activeNetworks) {
        const shareWindow = shareWindows[network];
        if (!shareWindow || shareWindow.closed) {
          blockedNetworks.push(network);
          continue;
        }
        shareWindow.location.href = shareUrls[network];
        shareWindow.opener = null;
      }

      const blockedMessage = blockedNetworks.length > 0
        ? ` Fenêtres bloquées (${blockedNetworks.join(', ')}); autorisez les popups pour les ouvrir.`
        : '';
      setSuccessMsg(`Publication enregistrée sur Actualités. Les partages sont prêts; confirmez-les sur chaque réseau.${blockedMessage}`);
      setTimeout(() => setSuccessMsg(''), 10000);
    } catch (error) {
      Object.values(shareWindows).forEach((shareWindow) => shareWindow?.close());
      setPublishError(error instanceof Error ? error.message : 'La publication a échoué.');
    } finally {
      setPublishingId(null);
    }
  };

  const getDomainIcon = (domain: TechItem['domain'], featured = false) => {
    const className = featured ? 'text-white' : undefined;
    switch (domain) {
      case 'IA': return <Cpu size={featured ? 42 : 16} className={className || 'text-purple-600'} />;
      case 'Base de données': return <Database size={featured ? 42 : 16} className={className || 'text-emerald-600'} />;
      case 'Développement': return <Code size={featured ? 42 : 16} className={className || 'text-blue-600'} />;
      case 'Réseaux': return <Wifi size={featured ? 42 : 16} className={className || 'text-amber-600'} />;
      default: return <Globe size={featured ? 42 : 16} className={className || 'text-blue-600'} />;
    }
  };

  const current = news[currentIndex] || INITIAL_TECH_NEWS[0];
  const goToStory = (offset: number) => {
    setCurrentIndex((index) => (index + offset + news.length) % news.length);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#24345e] bg-[#101d40] p-4 text-white shadow-sm sm:p-5">
      <header className="relative overflow-hidden border-b border-white/10 pb-3.5">
        <div aria-hidden="true" className="absolute -right-8 -top-16 h-48 w-48 rounded-full border-[24px] border-white/5" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37] text-slate-950 shadow-lg shadow-black/10">
              <Sparkles size={21} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-amber-300">Veille IT &amp; IA</p>
              <h3 className="mt-0.5 text-sm font-black leading-tight sm:text-base">Veille technologique internationale</h3>
              <p className="mt-1 text-[10px] leading-relaxed text-blue-100/70">Actualités mondiales en temps réel : IA, bases de données, développement, réseaux.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-bold ${
              feedSource === 'live'
                ? 'border-emerald-200/25 bg-emerald-300/10 text-emerald-100'
                : feedSource === 'fallback'
                  ? 'border-amber-200/25 bg-amber-300/10 text-amber-100'
                  : 'border-white/15 bg-white/10 text-blue-100'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                feedSource === 'live' ? 'bg-emerald-300' : feedSource === 'fallback' ? 'bg-amber-300' : 'bg-blue-200 animate-pulse'
              }`} />
              {feedSource === 'live' ? 'En direct' : feedSource === 'fallback' ? 'Mode secours' : 'Connexion'}
            </span>
            <button
              type="button"
              onClick={() => loadLiveTechNews(true)}
              title="Actualiser les flux"
              aria-label="Actualiser la veille technologique"
              disabled={isFetchingLive}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={15} className={isFetchingLive ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        <div className="relative mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-blue-100/65">
          <span className="inline-flex items-center gap-1"><Globe size={11} /> Sources internationales</span>
          <span className="inline-flex items-center gap-1"><Cpu size={11} /> IA</span>
          <span className="inline-flex items-center gap-1"><Code size={11} /> Développement</span>
          <span className="inline-flex items-center gap-1"><Wifi size={11} /> Réseaux</span>
          {lastUpdated && (
            <span className="ml-auto inline-flex items-center gap-1.5" aria-live="polite">
              <RefreshCw size={10} className={isFetchingLive ? 'animate-spin' : ''} />
              {isFetchingLive ? 'Actualisation…' : `Mis à jour à ${lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          )}
        </div>
      </header>

      <div className="pt-3.5">
        {refreshError && (
          <div role="status" className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-900">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
            <span>{refreshError}</span>
          </div>
        )}
        {successMsg && (
          <div role="status" className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs font-semibold text-emerald-800">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
        {publishError && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-800">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
            <span>{publishError}</span>
          </div>
        )}

        <style jsx>{`
          @keyframes techSlideInRight {
            from {
              opacity: 0;
              transform: translateX(90px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .tech-slide-in {
            animation: techSlideInRight 1.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
          @media (prefers-reduced-motion: reduce) {
            .tech-slide-in {
              animation: none;
            }
          }
        `}</style>
        <article key={current.id} className="tech-slide-in overflow-hidden">
          <div className="relative h-52 overflow-hidden rounded-xl border border-white/10 bg-[#172b56] sm:h-64">
            {current.coverImage ? (
              <img src={current.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <>
                <div aria-hidden="true" className="absolute -right-8 -top-12 h-36 w-36 rounded-full border-[22px] border-white/5" />
                <div aria-hidden="true" className="absolute -bottom-20 -left-8 h-44 w-44 rounded-full border-[24px] border-cyan-300/5" />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-blue-100/75">
                  Image de l’article
                </div>
              </>
            )}
          </div>

          <div className="flex min-w-0 flex-col pt-2.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-medium text-blue-100/65">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 font-bold text-slate-950">
                {getDomainIcon(current.domain)}
                {current.domain}
              </span>
              <span>{current.source}</span>
              <span>·</span>
              <span>{current.date}</span>
            </div>
            <h4 className="mt-2 text-base font-black leading-snug text-white sm:text-lg">{current.title}</h4>
            <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-blue-100/75">{current.summary}</p>

          </div>
        </article>

        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-[10px] font-bold text-blue-50">Publication destinée à la page Actualités</p>
              <p className="mt-0.5 text-[9px] leading-relaxed text-blue-100/60">Les annonces institutionnelles restent séparées dans la page Annonces.</p>
            </div>
            <div role="group" aria-label="Sélectionner les réseaux de partage" className="flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2">
              {(
                [
                  ['whatsapp', 'WhatsApp'],
                  ['facebook', 'Facebook'],
                  ['linkedin', 'LinkedIn'],
                  ['x', 'X (Twitter)'],
                ] as const
              ).map(([net, label]) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => toggleNetwork(net)}
                  title={`${selectedNetworks[net] ? 'Désactiver' : 'Activer'} le partage sur ${label}`}
                  aria-label={`Partager sur ${label}`}
                  aria-pressed={selectedNetworks[net]}
                  className={`inline-flex h-7 items-center justify-center gap-1 rounded-lg border px-2 text-[9px] font-semibold transition ${
                    selectedNetworks[net]
                      ? 'border-white bg-white text-emerald-700 shadow-sm'
                      : 'border-white/15 bg-white/5 text-blue-100/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {getSocialIcon(net)}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-[9px] font-bold text-white transition hover:bg-white/10"
          >
            <ExternalLink size={12} /> Suivre le lien d&apos;origine
          </a>
          <div className="flex flex-1 items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => handlePublishAndBroadcast(current)}
              disabled={publishingId !== null}
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#e9b91d] px-3 py-2 text-[9px] font-extrabold text-slate-950 shadow-sm transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishingId === current.id ? <RefreshCw size={14} className="animate-spin" /> : <Megaphone size={14} />}
              {publishingId === current.id ? 'Publication…' : 'Publier et préparer les partages'}
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
          <button
            type="button"
            onClick={() => goToStory(-1)}
            className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[9px] font-semibold text-blue-100 transition hover:bg-white/10"
          >
            <ArrowLeft size={11} className="mr-1 inline" />Précédent
          </button>
          <span className="text-[9px] font-bold text-amber-300">Article {currentIndex + 1} / {news.length}</span>
          <button
            type="button"
            onClick={() => goToStory(1)}
            className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[9px] font-semibold text-blue-100 transition hover:bg-white/10"
          >
            Suivant<ArrowRight size={11} className="ml-1 inline" />
          </button>
        </div>
      </div>
    </section>
  );
}
