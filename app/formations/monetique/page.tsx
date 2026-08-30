export default function Monetique() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Formation</p>
          <h1 className="text-4xl font-black md:text-6xl">Monétique</h1>
          <p className="mt-5 max-w-3xl text-lg text-blue-50">
            Une spécialité dédiée aux systèmes de paiement électronique, à la sécurité des transactions et à la gestion numérique des flux monétaires.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: 'Paiement électronique', text: 'Mise en place et sécurisation des dispositifs et outils de paiement.' },
            { title: 'Sécurité des transactions', text: 'Protection des données bancaires et réduction des risques opérationnels.' },
            { title: 'Gestion digitale', text: 'Optimisation des processus monétaires et transactionnels.' },
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
