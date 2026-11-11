import Link from 'next/link';

export default function LibraryLegalPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/bibliotheque" className="text-sm font-semibold text-cyan-800 hover:underline">← Retour à la bibliothèque</Link>
        <h1 className="mt-6 text-4xl font-black">Mentions légales de la bibliothèque</h1>
        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-bold">Publication et hébergement</h2>
          <p className="leading-7 text-slate-700">La bibliothèque numérique est une fonctionnalité du site de l’INPTIC et utilise son compte utilisateur, son infrastructure et ses règles de fonctionnement. Pour toute question relative à sa publication ou à son hébergement, contactez l’INPTIC.</p>
        </section>
        <section className="mt-7 space-y-3">
          <h2 className="text-2xl font-bold">Documents partagés</h2>
          <p className="leading-7 text-slate-700">Les personnes qui publient un document doivent disposer des droits nécessaires à sa mise à disposition. Un contenu signalé comme illicite ou portant atteinte aux droits d’un tiers peut être retiré après examen.</p>
        </section>
        <section className="mt-7 space-y-3">
          <h2 className="text-2xl font-bold">Données personnelles</h2>
          <p className="leading-7 text-slate-700">Les collections et progrès de lecture sont associés au compte INPTIC. Pour consulter les règles de traitement des données et exercer vos droits, utilisez les pages générales du site.</p>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-cyan-800">
            <Link href="/confidentialite" className="hover:underline">Politique de confidentialité</Link>
            <Link href="/conditions-d-utilisation" className="hover:underline">Conditions d’utilisation</Link>
            <Link href="/contact" className="hover:underline">Contacter l’INPTIC</Link>
          </div>
        </section>
      </article>
    </main>
  );
}
