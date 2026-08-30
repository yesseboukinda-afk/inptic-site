export default function Telecoms() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Formation</p>
          <h1 className="text-4xl font-black md:text-6xl">Télécommunications</h1>
          <p className="mt-5 max-w-3xl text-lg text-blue-50">
            Découvrez une spécialité centrée sur les réseaux, les systèmes embarqués, l’Internet des objets et les services numériques.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: 'Réseaux', text: 'Conception, administration et sécurisation des infrastructures réseau.' },
            { title: 'IoT', text: 'Développement de systèmes connectés et de services intelligents.' },
            { title: 'Services numériques', text: 'Mise en place de solutions réseau de qualité pour les organisations.' },
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
