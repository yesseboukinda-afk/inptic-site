'use client';

import { Search, ArrowRight, Bot, Box, FileText, GraduationCap } from 'lucide-react';
import { useState } from 'react';

const quickActions = [
  { label: 'INPTIC-Bot', icon: Bot, ariaLabel: 'Chat avec le bot INPTIC' },
  { label: 'Visite 3D', icon: Box, ariaLabel: 'Visiter le campus en 3D' },
  { label: 'Candidature', icon: FileText, ariaLabel: 'Accéder au formulaire de candidature' },
  { label: 'Plateforme', icon: GraduationCap, ariaLabel: 'Accéder à la plateforme étudiante' },
];

const galleryImages = [
  '/institut/1.jpg',
  '/institut/2.jpg',
  '/institut/3.jpg',
  '/institut/4.jpg',
  '/institut/5.jpg',
];

const sliderImages = [...galleryImages, ...galleryImages];

export default function Hero() {
  const [searchFocus, setSearchFocus] = useState(false);
  const [selectedAction, setSelectedAction] = useState('Visite 3D');

  return (
    <section className="relative min-h-[500px] bg-slate-900 overflow-hidden sm:min-h-[540px] md:min-h-[510px]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="hero-slider-track flex h-full w-max">
          {sliderImages.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="relative h-full w-screen shrink-0"
              style={{
                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.43), rgba(15, 23, 42, 0.51)), url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'saturate(1.05) contrast(1.02)',
              }}
            />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/55 via-slate-950/45 to-slate-950/55" />

      <div className="container-x relative grid items-center gap-8 py-12 text-white px-3 sm:px-4 md:py-28 md:px-0 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="space-y-4">
            <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Bienvenue à l'INPTIC Gabon
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-blue-100 sm:text-lg md:text-xl">
              Rejoignez la première université du numérique au Gabon et façonnez votre avenir dans les technologies de l'information.
            </p>
          </div>

          <a
            href="/formations"
            className="icon-only-mobile mt-4 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-6 py-3 font-semibold transition-all duration-200 hover:bg-blue-700 active:bg-blue-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:w-auto md:mt-8 md:px-8 md:py-4"
            role="button"
            aria-label="Découvrir nos formations"
          >
            <span className="btn-label">Découvrir nos formations</span>
            <ArrowRight size={20} aria-hidden="true" className="icon-slot transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </div>

        <div className={`glass mx-auto w-full max-w-md rounded-2xl p-5 shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-right-8 duration-700 sm:p-6 md:p-8 lg:ml-auto ${
          searchFocus ? 'ring-2 ring-blue-400 shadow-2xl' : ''
        }`}>
          <h2 className="mb-6 text-2xl font-bold md:text-3xl">Trouver ma formation</h2>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="search"
                className="w-full rounded-lg p-3 text-base text-slate-800 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 md:p-4"
                placeholder="Que voulez-vous étudier ?"
                aria-label="Champ de recherche de formation"
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
              />
              <Search size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            </div>

            <select
              className="w-full appearance-none rounded-lg bg-white p-3 text-base text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 md:p-4"
              aria-label="Domaine d'étude"
            >
              <option value="">Domaine d'étude</option>
              <option value="informatique">Informatique</option>
              <option value="mmi">Multimédia & Internet</option>
              <option value="telecom">Télécommunications</option>
              <option value="management">Management & TIC</option>
            </select>

            <select
              className="w-full appearance-none rounded-lg bg-white p-3 text-base text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 md:p-4"
              aria-label="Niveau d'études"
            >
              <option value="">Niveau</option>
              <option value="licence">Licence</option>
              <option value="ingenieur">Ingénieur</option>
            </select>

            <button
              className="icon-only-mobile flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 hover:shadow-lg active:scale-95 md:py-4"
              aria-label="Lancer la recherche de formations"
            >
              <span className="btn-label">Rechercher</span>
              <Search size={18} aria-hidden="true" className="icon-slot" />
            </button>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-blue-100">
            💡 Conseil: Affinez votre recherche en sélectionnant un domaine et un niveau d'études.
          </p>
        </div>
      </div>

      {/* Quick Action Buttons - Desktop */}
      <div className="absolute right-5 bottom-20 hidden xl:flex flex-col gap-3 bg-slate-900/55 backdrop-blur-sm p-4 rounded-xl text-xs text-center space-y-4 animate-in fade-in slide-in-from-right-8 duration-1000 border border-white/10">
        {quickActions.map(({ label, icon: Icon, ariaLabel }) => {
          const isSelected = selectedAction === label;

          return (
            <button
              key={label}
              type="button"
              onClick={() => setSelectedAction(label)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/70 ${
                isSelected
                  ? 'bg-[#D4AF37]/20 text-[#F4D06F] ring-1 ring-[#D4AF37]/70 shadow-[0_0_0_1px_rgba(212,175,55,0.7)]'
                  : 'text-white hover:bg-white/10'
              }`}
              aria-label={ariaLabel}
            >
              <Icon size={20} aria-hidden="true" className={isSelected ? 'text-[#F4D06F]' : 'text-white'} />
              <span className={`font-semibold ${isSelected ? 'text-[#F4D06F]' : 'text-white'}`}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Scroll Indicator - Mobile */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:hidden flex flex-col items-center gap-2 text-white/60 animate-bounce">
        <span className="text-xs font-medium">Parcourez</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
