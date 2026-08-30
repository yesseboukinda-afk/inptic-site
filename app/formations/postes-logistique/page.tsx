export default function PostesLogistique() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-r from-slate-900 to-blue-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">Formation</p>
          <h1 className="text-4xl font-black md:text-6xl">Postes & Logistique</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            Une formation orientée vers la gestion des opérations, la chaîne logistique et l’optimisation des processus de production et de distribution.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: 'Gestion logistique', text: 'Organisation, suivi et optimisation des flux matériels et informationnels.' },
            { title: 'Planification', text: 'Mise en place de processus efficaces pour piloter les activités de l’entreprise.' },
            { title: 'Performance opérationnelle', text: 'Amélioration continue des performances et de la qualité de service.' },
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
