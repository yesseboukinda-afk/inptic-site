export default function Presentation() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-r from-slate-900 to-blue-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">INPTIC Gabon</p>
          <h1 className="text-4xl font-black md:text-6xl">Présentation</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            L’INPTIC Gabon est un établissement de référence qui forme les talents du numérique dans une logique d’excellence, d’innovation et d’insertion professionnelle.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Notre identité</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Une école tournée vers l’avenir</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Conçu pour accompagner les étudiants dans leur développement académique et professionnel,
              l’INPTIC Gabon allie enseignement de qualité, encadrement humain et liens forts avec les acteurs économiques.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">Points forts</h3>
            <ul className="mt-6 space-y-4 text-slate-700">
              <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span><span>Programmes alignés sur les besoins du marché</span></li>
              <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span><span>Encadrement personnalisé</span></li>
              <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span><span>Approche pédagogique innovante</span></li>
              <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span><span>Ouverture vers l’international</span></li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
