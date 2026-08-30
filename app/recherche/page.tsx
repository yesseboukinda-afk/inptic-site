export default function Recherche() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-r from-sky-700 to-blue-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Recherche & innovation</p>
          <h1 className="text-4xl font-black md:text-6xl">Une culture d’innovation au cœur de l’INPTIC</h1>
          <p className="mt-5 max-w-3xl text-lg text-blue-50">
            Les laboratoires, les projets étudiants et l’incubateur technologique de l’INPTIC permettent à
            nos étudiants de développer des solutions concrètes et d’explorer les innovations du numérique.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Notre approche</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Innovation, projets et esprit entrepreneurial</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Nous encourageons la recherche appliquée et la création de projets utiles, innovants et
              porteurs de transformation pour la société et l’économie numérique.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">Axes de développement</h3>
            <ul className="mt-6 space-y-5 text-slate-700">
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>Laboratoires de recherche appliquée</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>Projets étudiants innovants</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>Incubateur Tech & startups</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>Partenariats académiques et industriels</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Exemples de projets</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Des idées créatives en action</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: 'IA & Data', text: 'Solutions d’analyse de données et d’intelligence artificielle adaptées à des contextes réels.' },
              { title: 'Systèmes embarqués', text: 'Développement de dispositifs connectés et de solutions numériques innovantes.' },
              { title: 'Startups & innovation', text: 'Accompagnement des étudiants dans la création d’entreprises et de projets à fort potentiel.' },
            ].map((project) => (
              <article key={project.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm">
                <div className="mb-4 h-12 w-12 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center text-xl font-black">✦</div>
                <h3 className="text-xl font-bold text-slate-900">{project.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{project.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
