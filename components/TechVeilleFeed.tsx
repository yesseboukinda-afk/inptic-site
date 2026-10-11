'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
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
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#102451] via-[#173875] to-[#175a78] px-5 py-5 text-white sm:px-6">
        <div aria-hidden="true" className="absolute -right-8 -top-16 h-48 w-48 rounded-full border-[24px] border-white/5" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37] text-slate-950 shadow-lg shadow-black/10">
              <Sparkles size={21} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-200">INPTIC · veille mondiale</p>
              <h3 className="mt-0.5 text-base font-black leading-tight sm:text-lg">Technologies, IA &amp; innovation</h3>
              <p className="mt-1 text-xs text-blue-100/80">Une sélection des dernières actualités technologiques.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={15} className={isFetchingLive ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-[11px] text-blue-100/75">
          <span className="inline-flex items-center gap-1.5"><Globe size={13} /> Sources internationales</span>
          <span className="inline-flex items-center gap-1.5"><Cpu size={13} /> IA</span>
          <span className="inline-flex items-center gap-1.5"><Code size={13} /> Développement</span>
          <span className="inline-flex items-center gap-1.5"><Wifi size={13} /> Réseaux</span>
          {lastUpdated && (
            <span className="ml-auto inline-flex items-center gap-1.5" aria-live="polite">
              <RefreshCw size={11} className={isFetchingLive ? 'animate-spin' : ''} />
              {isFetchingLive ? 'Actualisation…' : `Mis à jour à ${lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          )}
        </div>
      </header>

      <div className="p-4 sm:p-6">
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

        <article key={current.id} className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-48 overflow-hidden bg-gradient-to-br from-[#102451] via-[#234c86] to-cyan-700 lg:min-h-full">
            {current.coverImage ? (
              <img src={current.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <>
                <div aria-hidden="true" className="absolute -right-12 -top-12 h-48 w-48 rounded-full border-[28px] border-white/10" />
                <div aria-hidden="true" className="absolute -bottom-20 -left-12 h-56 w-56 rounded-full border-[30px] border-cyan-300/10" />
                <div className="absolute inset-0 flex items-center justify-center text-white/90">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm">
                    {getDomainIcon(current.domain, true)}
                  </div>
                </div>
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/10" />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-slate-950/35 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur">
              {getDomainIcon(current.domain)}
              {current.domain}
            </span>
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-white/90">
              <Globe size={13} /> {current.source}
            </span>
          </div>

          <div className="flex min-w-0 flex-col p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} className="text-blue-600" />{current.date}</span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 font-bold text-blue-700">À la une</span>
            </div>
            <h4 className="mt-4 text-lg font-black leading-snug text-slate-900 sm:text-xl">{current.title}</h4>
            <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-slate-600">{current.summary}</p>

            <div className="mt-auto flex items-center justify-between gap-3 pt-6">
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 transition hover:text-blue-900"
              >
                Lire à la source <ExternalLink size={13} />
              </a>
              <div className="flex items-center gap-2">
                <span className="mr-1 text-[11px] font-semibold tabular-nums text-slate-500">{currentIndex + 1}<span className="mx-1 text-slate-300">/</span>{news.length}</span>
                <button
                  type="button"
                  onClick={() => goToStory(-1)}
                  aria-label="Actualité précédente"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <ArrowLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => goToStory(1)}
                  aria-label="Actualité suivante"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white transition hover:bg-blue-800"
                >
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </article>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Partager cette actualité</p>
              <p className="mt-0.5 text-xs text-slate-500">Sélectionnez les réseaux à préparer avec la publication.</p>
            </div>
            <div role="group" aria-label="Sélectionner les réseaux de partage" className="flex flex-wrap items-center gap-2">
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
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                    selectedNetworks[net]
                      ? 'border-blue-200 bg-white text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-slate-100 text-slate-400 hover:bg-white hover:text-slate-700'
                  }`}
                >
                  {getSocialIcon(net)}
                  <span className="sr-only">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-sm text-[11px] leading-relaxed text-slate-500">
              La publication sera ajoutée aux Actualités. Vous pourrez confirmer chaque partage sur son réseau.
            </p>
            <button
              type="button"
              onClick={() => handlePublishAndBroadcast(current)}
              disabled={publishingId !== null}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-sm transition hover:bg-[#e6c141] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishingId === current.id ? <RefreshCw size={14} className="animate-spin" /> : <Megaphone size={14} />}
              {publishingId === current.id ? 'Publication en cours…' : 'Publier sur Actualités'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
