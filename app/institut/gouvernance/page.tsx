export default function Gouvernance() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-r from-slate-900 to-blue-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">INPTIC Gabon</p>
          <h1 className="text-4xl font-black md:text-6xl">Gouvernance</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            La gouvernance de l’INPTIC repose sur des principes de transparence, d’efficacité et de performance au service de la qualité de l’enseignement.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: 'Pilotage stratégique', text: 'Définition des orientations académiques et institutionnelles.' },
            { title: 'Qualité académique', text: 'Suivi des programmes, des résultats et de l’expérience étudiante.' },
            { title: 'Développement institutionnel', text: 'Évolution des infrastructures, partenariats et projets structurants.' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
