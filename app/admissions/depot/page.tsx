export default function Depot() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-r from-slate-900 to-blue-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">Admissions</p>
          <h1 className="text-4xl font-black md:text-6xl">Dépôt de dossier</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            Finalisez votre candidature en téléchargeant les pièces demandées et en suivant les instructions du dossier.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-slate-600">
            Cette page est prête pour intégrer le formulaire de dépôt de dossier en ligne et les règles de soumission.
          </p>
        </div>
      </section>
    </main>
  );
}
