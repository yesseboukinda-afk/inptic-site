export default function Gouvernance() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <div className="hero-image-reveal absolute inset-y-0 right-0 z-0 w-3/5 scale-105 bg-cover bg-center brightness-105 saturate-105" style={{ backgroundImage: "url('/banniere/7.webp')" }} aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.9) 28%, rgba(15, 23, 42, 0.58) 48%, rgba(30, 136, 168, 0.2) 72%, rgba(30, 136, 168, 0.05) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <div className="max-w-3xl">
            <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
            <h1 className="text-4xl font-black md:text-6xl">Gouvernance</h1>
            <p className="mt-5 text-lg text-slate-200">
              La gouvernance de l’INPTIC repose sur des principes de transparence, d’efficacité et de performance au service de la qualité de l’enseignement.
            </p>
          </div>
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
