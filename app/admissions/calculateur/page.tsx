export default function Calculateur() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="relative isolate overflow-hidden text-white">
          <div className="hero-image-reveal absolute inset-y-0 right-0 z-0 w-3/5 scale-105 bg-cover bg-center brightness-105 saturate-105" style={{ backgroundImage: "url('/banniere/2.webp')" }} aria-hidden="true" />
          <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Admissions</p>
          <h1 className="text-4xl font-black md:text-6xl">Calculateur d’éligibilité</h1>
          <p className="mt-5 max-w-3xl text-lg text-blue-50">
            Estimez rapidement votre admissibilité selon votre parcours, votre niveau d’études et la formation visée.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-slate-600">
            Cette page pourra prochainement intégrer un simulateur interactif pour estimer l’éligibilité aux filières de l’INPTIC.
          </p>
        </div>
      </section>
    </main>
  );
}
