export default function Contact() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
          <img src="/banniere/7.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
          <h1 className="text-4xl font-black md:text-6xl">Contact</h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Nous sommes à votre disposition pour répondre à vos questions sur les formations,
            la vie étudiante, les admissions et les partenariats.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Envoyez-nous un message</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Nous répondons rapidement</h2>

            <form className="mt-8 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nom</label>
                  <input className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white" placeholder="Votre nom" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">E-mail</label>
                  <input type="email" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white" placeholder="Votre e-mail" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Téléphone</label>
                <input className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white" placeholder="Votre numéro" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Message</label>
                <textarea rows={5} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white" placeholder="Décrivez votre demande..." />
              </div>

              <button type="button" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500">
                Envoyer
              </button>
            </form>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Contact</p>
              <h3 className="mt-3 text-2xl font-bold text-slate-900">Coordonnées</h3>

              <div className="mt-6 space-y-5 text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">Adresse</p>
                  <p className="mt-1">Feu tricolores gros bouquet, Libreville</p>
                  <p>Gabon</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-900">Téléphone</p>
                  <p className="mt-1">+241 065.67.96.86</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-900">E-mail</p>
                  <p className="mt-1">inptic@inptic-ga.org</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-900">Horaires</p>
                  <p className="mt-1">Nous sommes à votre écoute du lundi au vendredi.</p>
                </div>
              </div>
            </div>

          </aside>
        </div>
      </section>
    </main>
  );
}
