export default function Actualites() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-r from-slate-900 to-blue-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">INPTIC Gabon</p>
          <h1 className="text-4xl font-black md:text-6xl">Actualités</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            Suivez les événements, initiatives et avancées de l’Institut dans le numérique, la recherche et l’innovation.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Semaine de l’innovation 2025',
              label: 'Événement',
              text: 'Conférences, ateliers et hackathons autour des technologies émergentes et des usages du numérique.',
            },
            {
              title: 'Lancement de la plateforme INPTIC Alumni',
              label: 'Réseau',
              text: 'Un espace dédié à la rencontre entre anciens étudiants, enseignants et partenaires institutionnels.',
            },
            {
              title: 'Nos chercheurs présentent leurs travaux',
              label: 'Recherche',
              text: 'Des projets innovants en IA, cybersécurité, systèmes intelligents et transformation numérique.',
            },
          ].map((item) => (
            <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                {item.label}
              </span>
              <h2 className="mt-5 text-2xl font-bold text-slate-900">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
