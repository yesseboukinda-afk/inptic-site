import Link from 'next/link';

export default function Admissions() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img src="/banniere/2.webp" alt="" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
          <h1 className="text-4xl font-black md:text-6xl">Concours & Admissions</h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-50">
            Rejoignez l’Institut National des Technologies de l’Information et de la Communication
            et préparez votre avenir dans les métiers du numérique.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Pourquoi nous choisir ?</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Une admission claire, simple et orientée vers l’excellence</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              L’INPTIC Gabon accueille des étudiants motivés, curieux et désireux d’acquérir des
              compétences concrètes dans les technologies de l’information, les réseaux, le
              développement logiciel, les systèmes numériques et les métiers de l’innovation.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Notre processus d’admission vise à identifier les talents prometteurs et à les guider
              vers des formations de haut niveau, conçues pour répondre aux besoins du marché et à la
              transformation numérique du pays.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">Étapes du dossier</h3>
            <ul className="mt-6 space-y-5 text-slate-700">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">1</span>
                <div>
                  <p className="font-semibold text-slate-900">Consulter le guide d’admission</p>
                  <p className="text-sm text-slate-600">Découvrez les conditions, qualifications et modalités d’inscription.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">2</span>
                <div>
                  <p className="font-semibold text-slate-900">Vérifier son éligibilité</p>
                  <p className="text-sm text-slate-600">Utilisez notre simulateur pour estimer votre admissibilité selon votre profil.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">3</span>
                <div>
                  <p className="font-semibold text-slate-900">Déposer le dossier</p>
                  <p className="text-sm text-slate-600">Soumettez votre candidature et vos pièces justificatives via notre plateforme.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">4</span>
                <div>
                  <p className="font-semibold text-slate-900">Suivre votre dossier en temps réel</p>
                  <p className="text-sm text-slate-600">Recevez les mises à jour sur votre admission et votre inscription.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Nos offres</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Tout ce qu’il faut pour candidater</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              { title: 'Guide d’admission', text: 'Découvrez les diplômes, les niveaux d’accès et les critères d’admission.' },
              { title: 'Calculateur d’éligibilité', text: 'Évaluez votre profil et identifiez la formation la plus adaptée à votre parcours.' },
              { title: 'Dépôt de dossier', text: 'Téléchargez les pièces demandées et finalisez votre candidature en quelques étapes.' },
              { title: 'Suivi en temps réel', text: 'Suivez l’état de votre dossier et recevez les notifications importantes.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="mb-4 h-12 w-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-xl font-black text-blue-700">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-8 md:px-8">
        <div className="rounded-3xl bg-slate-900 px-6 py-10 text-white md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-blue-200">Restez informé</p>
              <h3 className="mt-2 text-3xl font-bold">Préparez votre candidature dès aujourd’hui</h3>
            </div>
            <Link href="/admissions/depot" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500">
              Déposer mon dossier
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
