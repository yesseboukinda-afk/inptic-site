'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Box, Maximize2, Play, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { zones } from './zones';

const TourScene = dynamic(() => import('./tourScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-white">…</div>
  ),
});

function TourViewer({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [activeZone, setActiveZone] = useState('campus');
  const [resetKey, setResetKey] = useState(0);
  const labels = Object.fromEntries(zones.map((z) => [z.id, t(z.labelKey)]));

  // Verrouille le scroll de la page + fermeture avec Échap
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const reset = () => {
    setActiveZone('campus');
    setResetKey((k) => k + 1); // remonte la scène : caméra remise à zéro
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t('pages.explore3d')}
    >
      <div className="relative h-[90dvh] w-[90vw] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0b1a2e] to-[#08111f] shadow-2xl">
        <div className="absolute inset-0">
          <TourScene key={resetKey} activeZone={activeZone} onZoneSelect={setActiveZone} labels={labels} />
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={t('pages.closeTour', 'Fermer la visite 3D')}
          className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-slate-900/80 p-2.5 text-white backdrop-blur-sm transition hover:border-cyan-300 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <p className="pointer-events-none absolute left-4 top-4 max-w-[60%] rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 backdrop-blur-sm">
          {t('pages.dragHint', 'Faites glisser pour tourner, pincez ou utilisez la molette pour zoomer')}
        </p>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            aria-label={t('pages.reset')}
            className="pointer-events-auto rounded-xl border border-white/10 bg-slate-900/85 p-3 text-white backdrop-blur-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <RotateCcw size={18} aria-hidden="true" />
          </button>

          <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-slate-900/85 p-1.5 backdrop-blur-sm">
            {zones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                aria-pressed={activeZone === zone.id}
                onClick={() => setActiveZone(zone.id)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
                  activeZone === zone.id ? 'bg-amber-300 text-slate-900' : 'text-white hover:bg-white/10'
                }`}
              >
                {t(zone.labelKey)}
                <Maximize2 size={13} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Visite3DPage() {
  const { t } = useTranslation();
  // 'prompt' = notification affichée, 'idle' = refusé, 'active' = visite ouverte
  const [stage, setStage] = useState<'prompt' | 'idle' | 'active'>('prompt');
  const closeTour = useCallback(() => setStage('idle'), []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img src="/banniere/7.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-100 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-white">
            <ArrowLeft size={18} aria-hidden="true" />
            {t('common.home')}
          </Link>
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
              <Box size={18} aria-hidden="true" />
              {t('pages.explore3d')}
            </div>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">{t('pages.explore3d')}</h1>
            <p className="mt-5 text-lg text-slate-200">{t('pages.explore3dIntro')}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Aperçu statique : aucun WebGL, aucun téléchargement du modèle */}
          <div className="relative min-h-[480px] overflow-hidden rounded-2xl border border-white/10 bg-[#08111f] shadow-2xl sm:min-h-[580px]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:44px_44px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.14),transparent_48%)]" />
            <div aria-hidden="true" className={`absolute inset-0 flex items-center justify-center ${stage === 'prompt' ? 'opacity-40 blur-[2px]' : ''}`}>
              <Box className="text-cyan-300/60" size={120} strokeWidth={1} />
            </div>

            {stage === 'prompt' && (
              <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                <div role="dialog" aria-labelledby="tour-prompt" className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
                  <Box className="mx-auto mb-3 text-blue-600" size={32} aria-hidden="true" />
                  <h2 id="tour-prompt" className="text-lg font-bold">{t('pages.startTour3d', 'Commencer la visite 3D ?')}</h2>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setStage('idle')} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400">
                      {t('pages.no', 'Non')}
                    </button>
                    <button type="button" autoFocus onClick={() => setStage('active')} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
                      {t('pages.yes', 'Oui')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">{t('pages.navigation')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('pages.navigationIntro')}</p>
            <button
              type="button"
              onClick={() => setStage('prompt')}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              <Play size={16} aria-hidden="true" />
              {t('pages.launchTour', 'Lancer la visite 3D')}
            </button>
          </aside>
        </div>
      </section>

      {stage === 'active' && <TourViewer onClose={closeTour} />}
    </main>
  );
}