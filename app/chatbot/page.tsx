'use client';

import { Bot, Mic, Search, Volume2 } from 'lucide-react';

export default function ChatbotPage() {
  const openSohane = () => {
    window.dispatchEvent(new Event('open-inptic-chat'));
  };

  return (
    <main className="min-h-[65vh] bg-slate-50 px-4 py-16 text-slate-900 sm:px-6">
      <section className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-blue-100">
            <Bot size={34} aria-hidden="true" />
          </span>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-blue-200">Votre assistante INPTIC</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Sohane</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-blue-50 sm:text-lg">
            Posez vos questions sur les formations, les admissions et la vie étudiante. Sohane vous répond à l’écrit ou à la voix.
          </p>
          <button
            type="button"
            onClick={openSohane}
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-blue-900 shadow-lg transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-900"
          >
            <Bot size={19} aria-hidden="true" />
            Discuter avec Sohane
          </button>
          <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-white/15 bg-white/5 p-4">
              <Mic size={19} className="text-blue-200" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold">Parlez naturellement</p>
              <p className="mt-1 text-xs leading-5 text-blue-100">Utilisez le microphone et l’écoute vocale de votre navigateur.</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-4">
              <Search size={19} className="text-blue-200" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold">Recherchez sur le Web</p>
              <p className="mt-1 text-xs leading-5 text-blue-100">Demandez « cherche sur internet… » pour ouvrir les résultats dans un onglet.</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-4">
              <Volume2 size={19} className="text-blue-200" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold">Gardez vos préférences</p>
              <p className="mt-1 text-xs leading-5 text-blue-100">Demandez à Sohane de retenir ou d’oublier une information sur cet appareil.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
