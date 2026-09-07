'use client';

import Link from 'next/link';
import { ArrowLeft, Box, Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';

const zones = [
  { id: 'campus', label: 'Vue du campus', position: 'left-[25%] top-[35%]' },
  { id: 'formations', label: 'Pôle formations', position: 'left-[58%] top-[28%]' },
  { id: 'innovation', label: 'Espace innovation', position: 'left-[48%] top-[62%]' },
];

export default function Visite3DPage() {
  const [rotation, setRotation] = useState({ x: -12, y: -24 });
  const [zoom, setZoom] = useState(1);
  const [activeZone, setActiveZone] = useState('campus');

  const resetView = () => {
    setRotation({ x: -12, y: -24 });
    setZoom(1);
    setActiveZone('campus');
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img src="/banniere/7.webp" alt="" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-100 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Retour à l'accueil
        </Link>

        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
            <Box size={18} aria-hidden="true" />
            Visite immersive
          </div>
          <h1 className="text-4xl font-black leading-tight md:text-6xl">Explorez l'INPTIC en 3D</h1>
          <p className="mt-5 text-lg text-slate-200">
            Découvrez les espaces de l'institut dans une expérience interactive. La scène est prête à accueillir les prochains modèles 3D du campus.
          </p>
        </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div className="relative min-h-[480px] overflow-hidden rounded-2xl border border-white/10 bg-[#08111f] shadow-2xl sm:min-h-[580px]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:44px_44px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.14),transparent_48%)]" />

            <div className="absolute left-5 top-5 z-10 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 backdrop-blur-sm">
              Prototype de visite 3D
            </div>

            <div className="absolute inset-0 flex items-center justify-center [perspective:1000px]">
              <div
                className="relative h-56 w-56 transition-transform duration-500 ease-out sm:h-72 sm:w-72"
                style={{
                  transform: `scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                <div className="absolute inset-0 translate-z-8 border-2 border-cyan-300/80 bg-cyan-400/10 shadow-[0_0_70px_rgba(34,211,238,0.25)] [transform:translateZ(32px)]" />
                <div className="absolute inset-0 border-2 border-cyan-300/30 bg-slate-900/80 [transform:translateZ(-32px)]" />
                <div className="absolute inset-0 border border-cyan-300/50 [transform:rotateY(90deg)_translateZ(32px)]" />
                <div className="absolute inset-0 border border-cyan-300/50 [transform:rotateY(-90deg)_translateZ(32px)]" />
                <div className="absolute inset-0 border border-cyan-300/50 [transform:rotateX(90deg)_translateZ(32px)]" />
                <div className="absolute inset-0 border border-cyan-300/50 [transform:rotateX(-90deg)_translateZ(32px)]" />
                <div className="absolute inset-x-8 top-1/2 h-px bg-amber-300 shadow-[0_0_20px_rgba(252,211,77,0.9)] [transform:translateZ(40px)]" />
                <div className="absolute left-1/2 top-8 h-40 w-px bg-amber-300 shadow-[0_0_20px_rgba(252,211,77,0.9)] [transform:translateX(-50%)_translateZ(40px)]" />
              </div>
            </div>

            {zones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => setActiveZone(zone.id)}
                className={`absolute z-10 ${zone.position} h-4 w-4 rounded-full border-2 border-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-300 ${activeZone === zone.id ? 'scale-150 bg-amber-300 shadow-[0_0_0_7px_rgba(252,211,77,0.2)]' : 'bg-cyan-300 hover:scale-125'}`}
                aria-label={zone.label}
              />
            ))}

            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
              <p className="max-w-xs text-xs leading-relaxed text-slate-400">Sélectionnez un point d'intérêt pour préparer la prochaine visite guidée.</p>
              <button
                type="button"
                onClick={resetView}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:border-cyan-300 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                <RotateCcw size={15} aria-hidden="true" />
                Réinitialiser
              </button>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Navigation</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">Utilisez les commandes pour orienter la scène et parcourir les zones.</p>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRotation((current) => ({ ...current, y: current.y - 15 }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold transition hover:border-blue-400 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Tourner gauche
              </button>
              <button
                type="button"
                onClick={() => setRotation((current) => ({ ...current, y: current.y + 15 }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold transition hover:border-blue-400 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Tourner droite
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 p-2">
              <button type="button" onClick={() => setZoom((current) => Math.max(0.75, current - 0.15))} className="rounded-md p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="Réduire le zoom">
                <Minus size={18} aria-hidden="true" />
              </button>
              <span className="text-sm font-semibold">Zoom {Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((current) => Math.min(1.5, current + 0.15))} className="rounded-md p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="Augmenter le zoom">
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Points d'intérêt</h3>
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setActiveZone(zone.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition ${activeZone === zone.id ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-300' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {zone.label}
                  <Maximize2 size={15} aria-hidden="true" />
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
