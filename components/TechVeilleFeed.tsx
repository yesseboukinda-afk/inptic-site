'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Megaphone, Sparkles, Share2, Globe, Cpu, Database, Code, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';

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

export default function TechVeilleFeed() {
  const [news, setNews] = useState<TechItem[]>(INITIAL_TECH_NEWS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [targetPage, setTargetPage] = useState<'actualites' | 'annonces' | 'both'>('both');
  const [selectedNetworks, setSelectedNetworks] = useState({
    whatsapp: true,
    facebook: true,
    linkedin: true,
    x: true,
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [isFetchingLive, setIsFetchingLive] = useState(true);

  const loadLiveTechNews = () => {
    setIsFetchingLive(true);
    fetch('/api/tech-veille')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.items) && data.items.length > 0) {
          setNews(data.items);
        }
      })
      .catch(() => {})
      .finally(() => setIsFetchingLive(false));
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
    }, 7000);
    return () => clearInterval(timer);
  }, [news.length]);

  const toggleNetwork = (net: keyof typeof selectedNetworks) => {
    setSelectedNetworks((prev) => ({ ...prev, [net]: !prev[net] }));
  };

  const handlePublishAndBroadcast = async (item: TechItem) => {
    setPublishingId(item.id);
    setSuccessMsg('');

    const formattedPost = `🚀 [VEILLE IT & IA - INPTIC GABON]\n\n${item.title}\n\n📌 Résumé : ${item.summary}\n\n🔗 Source officielle : ${item.url}\n\n#INPTIC #Gabon #Tech #IA #Innovation #Digital`;

    if (targetPage === 'actualites' || targetPage === 'both') {
      try {
        await fetch('/api/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `[Veille IT] ${item.title}`,
            category: 'Annonce',
            excerpt: formattedPost,
            attachments: [],
            socialLinks: [{ label: 'Source originale', url: item.url }],
          }),
        });
      } catch {
        // ignore
      }
    }

    try {
      await navigator.clipboard.writeText(formattedPost);
    } catch {
      // ignore
    }

    const activeNets = Object.entries(selectedNetworks).filter(([_, active]) => active).map(([net]) => net);

    if (activeNets.includes('whatsapp')) {
      window.open(`https://wa.me/?text=${encodeURIComponent(formattedPost)}`, '_blank');
    }
    if (activeNets.includes('facebook')) {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(item.url)}`, '_blank');
    }
    if (activeNets.includes('linkedin')) {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(item.url)}`, '_blank');
    }
    if (activeNets.includes('x')) {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(formattedPost)}`, '_blank');
    }

    setSuccessMsg(`Publication structurée ! Texte copié et diffusion lancée sur les réseaux sélectionnés.`);
    setPublishingId(null);
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const getDomainIcon = (domain: TechItem['domain']) => {
    switch (domain) {
      case 'IA': return <Cpu size={16} className="text-purple-600" />;
      case 'Base de données': return <Database size={16} className="text-emerald-600" />;
      case 'Développement': return <Code size={16} className="text-blue-600" />;
      case 'Réseaux': return <Wifi size={16} className="text-amber-600" />;
      default: return <Globe size={16} className="text-blue-600" />;
    }
  };

  const current = news[currentIndex] || INITIAL_TECH_NEWS[0];

  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-[#14306b] p-6 text-white shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37] text-slate-950 font-black shadow">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-base font-black flex items-center gap-2">
              <span>Veille Technologique Internationale IT &amp; IA</span>
              {isFetchingLive && <RefreshCw size={13} className="animate-spin text-cyan-300" />}
            </h3>
            <p className="text-xs text-slate-300">Actualités mondiales en temps réel (IA, Bases de données, Dev, Réseaux)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-blue-500/20 px-3 py-1 font-bold text-cyan-300 border border-blue-400/30">
            {currentIndex + 1} / {news.length} (Flux direct)
          </span>
          <button
            onClick={loadLiveTechNews}
            title="Actualiser les flux en direct"
            className="rounded-lg bg-white/10 p-2 hover:bg-white/20 transition"
          >
            <RefreshCw size={14} className={isFetchingLive ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-500/20 p-3 text-xs font-bold text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Carrousel Slide */}
      <div className="mt-6 space-y-4">
        {current.coverImage && (
          <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-md">
            <img src={current.coverImage} alt={current.title} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-amber-300">
            {getDomainIcon(current.domain)}
            {current.domain}
          </span>
          <span className="text-xs text-slate-400">• {current.source}</span>
          <span className="text-xs text-slate-500">• {current.date}</span>
        </div>

        <h4 className="text-lg sm:text-xl font-black text-white leading-snug">{current.title}</h4>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{current.summary}</p>

        {/* Sélection de la page de publication */}
        <div className="space-y-2.5 bg-white/5 p-3.5 rounded-2xl border border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">Publier sur les pages :</span>
            {(
              [
                ['actualites', 'Page Actualités'],
                ['annonces', 'Page Annonces'],
                ['both', 'Les deux pages'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setTargetPage(val)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  targetPage === val ? 'bg-[#D4AF37] text-slate-950 shadow' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            <span className="text-xs font-semibold text-slate-300">Diffuser sur les réseaux :</span>
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
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  selectedNetworks[net] ? 'bg-blue-600 text-white shadow' : 'bg-white/10 text-slate-400 line-through hover:bg-white/20'
                }`}
              >
                <span>{label}</span>
                <span>{selectedNetworks[net] ? '✓' : '✗'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions Admin */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
          >
            <ExternalLink size={14} />
            <span>Suivre le lien d&apos;origine</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePublishAndBroadcast(current)}
              disabled={publishingId === current.id}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:bg-[#e6c141] transition shadow disabled:opacity-50"
            >
              <Megaphone size={14} />
              <span>{publishingId === current.id ? 'Diffusion en cours...' : 'Publier & Diffuser sur les réseaux'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
