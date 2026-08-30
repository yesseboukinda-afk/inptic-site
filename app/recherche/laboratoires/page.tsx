export default function Laboratoires() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-r from-sky-700 to-blue-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Recherche & innovation</p>
          <h1 className="text-4xl font-black md:text-6xl">Laboratoires</h1>
          <p className="mt-5 max-w-3xl text-lg text-blue-50">
            Les laboratoires de l’INPTIC favorisent la recherche appliquée, l’innovation et le développement de solutions utiles pour les entreprises et la société.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: 'IA & Données', text: 'Analyse de données, modélisation et solutions intelligentes.' },
            { title: 'Réseaux & Sécurité', text: 'Études et expérimentations sur les systèmes sécurisés et fiables.' },
            { title: 'Innovation numérique', text: 'Recherche appliquée et mise en œuvre de technologies émergentes.' },
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
