'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import inpticLogo from '@/logoinptic.png';
import { ShieldCheck, Users, ChevronDown } from 'lucide-react';

export default function OrganigrammePage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-slate-100 pb-24 text-slate-900">
      {/* Banner */}
      <section className="relative isolate overflow-hidden text-white bg-slate-950">
        <img
          src="/banniere/1.webp"
          alt=""
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.88) 30%, rgba(15, 23, 42, 0.48) 50%, rgba(30, 136, 168, 0.16) 75%, rgba(30, 136, 168, 0.04) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
          <h1 className="text-4xl font-black md:text-6xl">Organigramme Institutionnel</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            Structure hiérarchique officielle de l&apos;Institut National de la Poste, des Technologies de l&apos;Information et de la Communication du Gabon.
          </p>
        </div>
      </section>

      {/* Main Hierarchy Shell */}
      <section className="mx-auto max-w-[1550px] px-4 py-12">
        <div className="overflow-x-auto pb-8">
          <div className="min-w-[1280px] flex flex-col items-center text-center space-y-6">

            {/* 1. Président du Conseil d'Administration */}
            <div className="w-96 rounded-2xl border-2 border-[#D4AF37] bg-gradient-to-r from-slate-900 via-[#14306b] to-slate-900 p-4 text-white shadow-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37]">
                Gouvernance Haute
              </span>
              <h2 className="text-xl font-black text-white mt-1">
                Président du Conseil d&apos;Administration
              </h2>
            </div>

            {/* Vertical Line */}
            <div className="h-8 w-1 bg-slate-400" />

            {/* 2. Directeur Général */}
            <div className="w-96 rounded-2xl border-2 border-blue-600 bg-slate-900 p-4 text-white shadow-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">
                Direction Exécutive
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                Directeur Général
              </h2>
            </div>

            {/* Vertical Line */}
            <div className="h-6 w-1 bg-slate-400" />

            {/* 3. Services rattachés & Conseillers du DG */}
            <div className="grid grid-cols-2 gap-3 w-[520px] rounded-2xl border border-slate-300 bg-white p-4 shadow-sm text-xs font-bold text-slate-800">
              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                Chef de Service Administratif et Financier
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                Conseillers
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                Contrôleur de Gestion
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                Assistante du DG
              </div>
              <div className="col-span-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                Chargés d&apos;études
              </div>
            </div>

            {/* Vertical Line Branching to 5 Main Directions */}
            <div className="relative w-full py-4">
              <div className="mx-auto h-8 w-1 bg-slate-400" />
              <div className="h-1 bg-slate-400 w-[84%] mx-auto" />
            </div>

            {/* 4. Les 5 Grandes Directions Opérationnelles */}
            <div className="grid grid-cols-5 gap-4 w-full items-start text-xs font-semibold">

              {/* Direction 1: DEP */}
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-blue-600 bg-slate-900 p-3.5 text-white shadow-md min-h-[90px] flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-cyan-300 uppercase tracking-wider">Direction 1</span>
                  <h3 className="font-black text-sm text-white mt-1 leading-snug">
                    Directeur des Études et de la Pédagogie
                  </h3>
                </div>

                <div className="h-4 w-0.5 bg-slate-300 mx-auto" />

                <div className="space-y-2 text-slate-800">
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Chef de Département Réseaux et Systèmes Numériques
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Chef de Département Management et Commerce
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Chef de Département Management des TIC
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Chef de Département Audiovisuel
                  </div>
                </div>
              </div>

              {/* Direction 2: Formation Continue */}
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-purple-600 bg-slate-900 p-3.5 text-white shadow-md min-h-[90px] flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-purple-300 uppercase tracking-wider">Direction 2</span>
                  <h3 className="font-black text-sm text-white mt-1 leading-snug">
                    Directeur de la Formation Continue
                  </h3>
                </div>

                <div className="h-4 w-0.5 bg-slate-300 mx-auto" />

                <div className="space-y-2 text-slate-800">
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Services Stage et Emploi
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Service Planification et Évaluation
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Service Veille Technologique et Accompagnement VAE
                  </div>
                </div>
              </div>

              {/* Direction 3: Ressources Techniques & Innovation */}
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-emerald-600 bg-slate-900 p-3.5 text-white shadow-md min-h-[90px] flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">Direction 3</span>
                  <h3 className="font-black text-sm text-white mt-1 leading-snug">
                    Directeur des Ressources Techniques et de l&apos;Innovation
                  </h3>
                </div>

                <div className="h-4 w-0.5 bg-slate-300 mx-auto" />

                <div className="space-y-2 text-slate-800">
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Chef du Centre de Maintenance et Assistance Technique
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Chef de Centre de Ressources Documentaires
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Chef de Service Informatique et Gestion du Système d&apos;Information
                  </div>
                </div>
              </div>

              {/* Direction 4: Centre Avicenne UNESCO */}
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-amber-500 bg-slate-900 p-3.5 text-white shadow-md min-h-[90px] flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider">Direction 4</span>
                  <h3 className="font-black text-sm text-white mt-1 leading-snug">
                    Directeur du Centre Avicenne-UNESCO-INPTIC
                  </h3>
                </div>

                <div className="h-4 w-0.5 bg-slate-300 mx-auto" />

                <div className="space-y-2 text-slate-800">
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Expert Pédagogique
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Expert Technique
                  </div>
                </div>
              </div>

              {/* Direction 5: Secrétariat Général */}
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-[#D4AF37] bg-slate-900 p-3.5 text-white shadow-md min-h-[90px] flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-amber-200 uppercase tracking-wider">Direction 5</span>
                  <h3 className="font-black text-sm text-white mt-1 leading-snug">
                    Secrétaire Général
                  </h3>
                </div>

                <div className="h-4 w-0.5 bg-slate-300 mx-auto" />

                <div className="space-y-2 text-slate-800">
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Chef de Service Scolarité
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Chef de Service Communication et Relations Extérieures
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Chef de Service Logistique et Achats
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs font-bold">
                    Chef de Service Social
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
