'use client';

import Link from 'next/link';
import { ArrowLeft, Box, Maximize2, Minus, Play, Plus, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const zones = [
  { id: 'campus', labelKey: 'pages.zoneCampus', left: 25, top: 30 },
  { id: 'formations', labelKey: 'pages.zoneFormations', left: 65, top: 25 },
  { id: 'innovation', labelKey: 'pages.zoneInnovation', left: 50, top: 65 },
];

const DEFAULT_ROTATION = { x: -12, y: -24 };
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

type CubeProps = {
  rotation: { x: number; y: number };
  zoom: number;
  activeZone: string;
  dragging?: boolean;
  onZoneSelect?: (id: string) => void;
  interactive?: boolean;
};

function Cube({ rotation, zoom, activeZone, dragging = false, onZoneSelect, interactive = false }: CubeProps) {
  const { t } = useTranslation();
  const half = 'calc(var(--s)/2)';

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center [perspective:1000px]">
      <div
        className={`relative h-[var(--s)] w-[var(--s)] [--s:14rem] sm:[--s:18rem] ${dragging ? '' : 'transition-transform duration-300 ease-out motion-reduce:transition-none'}`}
        style={{
          transform: `scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="absolute inset-0 border-2 border-cyan-300/80 bg-cyan-400/10 shadow-[0_0_70px_rgba(34,211,238,0.25)]" style={{ transform: `translateZ(${half})` }} />
        <div className="absolute inset-0 border-2 border-cyan-300/30 bg-slate-900/80" style={{ transform: `rotateY(180deg) translateZ(${half})` }} />
        <div className="absolute inset-0 border border-cyan-300/50 bg-cyan-400/5" style={{ transform: `rotateY(90deg) translateZ(${half})` }} />
        <div className="absolute inset-0 border border-cyan-300/50 bg-cyan-400/5" style={{ transform: `rotateY(-90deg) translateZ(${half})` }} />
        <div className="absolute inset-0 border border-cyan-300/50 bg-cyan-400/5" style={{ transform: `rotateX(90deg) translateZ(${half})` }} />
        <div className="absolute inset-0 border border-cyan-300/50 bg-cyan-400/5" style={{ transform: `rotateX(-90deg) translateZ(${half})` }} />

        {/* Repères attachés à la face avant : ils suivent la rotation */}
        {zones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            tabIndex={interactive ? 0 : -1}
            aria-hidden={!interactive}
            aria-pressed={activeZone === zone.id}
            aria-label={t(zone.labelKey)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onZoneSelect?.(zone.id)}
            className={`absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white [backface-visibility:hidden] focus:outline-none focus:ring-2 focus:ring-cyan-300 ${interactive ? 'pointer-events-auto' : ''} ${activeZone === zone.id ? 'bg-amber-300 shadow-[0_0_0_7px_rgba(252,211,77,0.25)]' : 'bg-cyan-300'}`}
            style={{ left: `${zone.left}%`, top: `${zone.top}%`, transform: `translate(-50%, -50%) translateZ(calc(var(--s)/2 + 10px))` }}
          />
        ))}
      </div>
    </div>
  );
}

function TourViewer({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [rotation, setRotation] = useState(DEFAULT_ROTATION);
  const [zoom, setZoom] = useState(1);
  const [activeZone, setActiveZone] = useState('campus');
  const [dragging, setDragging] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastPinch = useRef<number | null>(null);

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

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      setRotation((r) => ({ x: clamp(r.x - dy * 0.4, -80, 80), y: r.y + dx * 0.4 }));
    } else if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastPinch.current) {
        const ratio = dist / lastPinch.current;
        setZoom((z) => clamp(z * ratio, 0.5, 2.5));
      }
      lastPinch.current = dist;
    }
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) lastPinch.current = null;
    if (pointers.current.size === 0) setDragging(false);
  };

  const onWheel = (e: React.WheelEvent) => setZoom((z) => clamp(z - e.deltaY * 0.001, 0.5, 2.5));

  const reset = () => {
    setRotation(DEFAULT_ROTATION);
    setZoom(1);
    setActiveZone('campus');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t('pages.explore3d')}
    >
      <div className="relative h-[90dvh] w-[90vw] overflow-hidden rounded-2xl border border-white/10 bg-[#08111f] shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.14),transparent_48%)]" />

        {/* Surface de manipulation souris + tactile */}
        <div
          className={`absolute inset-0 select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onWheel={onWheel}
        />
        <Cube rotation={rotation} zoom={zoom} activeZone={activeZone} dragging={dragging} onZoneSelect={setActiveZone} interactive />

        {/* Bouton fermer */}
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

        {/* Barre d'outils */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/85 p-1.5 backdrop-blur-sm">
            <button type="button" onClick={() => setZoom((z) => clamp(z - 0.15, 0.5, 2.5))} aria-label={t('pages.zoomOut')} className="rounded-md p-2 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300">
              <Minus size={18} aria-hidden="true" />
            </button>
            <span className="min-w-14 text-center text-xs font-semibold text-white">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((z) => clamp(z + 0.15, 0.5, 2.5))} aria-label={t('pages.zoomIn')} className="rounded-md p-2 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300">
              <Plus size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={reset} aria-label={t('pages.reset')} className="rounded-md p-2 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300">
              <RotateCcw size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-slate-900/85 p-1.5 backdrop-blur-sm">
            {zones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                aria-pressed={activeZone === zone.id}
                onClick={() => setActiveZone(zone.id)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${activeZone === zone.id ? 'bg-amber-300 text-slate-900' : 'text-white hover:bg-white/10'}`}
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
  // 'prompt' = notification affichée, 'idle' = refusé / rien, 'active' = visite ouverte
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
          {/* Aperçu inerte : ne capture ni le scroll ni les gestes */}
          <div className="relative min-h-[480px] overflow-hidden rounded-2xl border border-white/10 bg-[#08111f] shadow-2xl sm:min-h-[580px]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:44px_44px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.14),transparent_48%)]" />
            <div aria-hidden="true" className={stage === 'prompt' ? 'opacity-40 blur-[2px]' : ''}>
              <Cube rotation={DEFAULT_ROTATION} zoom={1} activeZone="campus" />
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