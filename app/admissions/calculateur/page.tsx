export default function Calculateur() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
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
