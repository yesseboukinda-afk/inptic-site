export default function GenieLogiciel() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-r from-blue-700 to-sky-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Formation</p>
          <h1 className="text-4xl font-black md:text-6xl">Génie logiciel</h1>
          <p className="mt-5 max-w-3xl text-lg text-blue-50">
            Apprenez à concevoir, développer et maintenir des logiciels fiables, évolutifs et alignés sur les besoins des entreprises.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: 'Architecture logicielle', text: 'Compréhension des principes de conception et de structure applicative.' },
            { title: 'Développement', text: 'Création d’interfaces, API et services applicatifs robustes.' },
            { title: 'Qualité logicielle', text: 'Méthodes pour tester, sécuriser et maintenir des produits fiables.' },
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
