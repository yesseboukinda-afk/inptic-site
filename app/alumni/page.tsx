export default function Alumni() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img
          src="/banniere/1.webp"
          alt=""
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <img src="/logoinptic.png" alt="Logo INPTIC" className="h-9 w-auto object-contain object-left" />
          <h1 className="mt-3 max-w-3xl text-4xl font-black md:text-6xl">Réseau Alumni</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            Restez connecté à l&apos;INPTIC, développez votre réseau professionnel et partagez les réussites de notre communauté d&apos;anciens étudiants.
          </p>
        </div>
      </section>

      <nav className="border-b border-slate-200 bg-white" aria-label="Navigation Alumni">
        <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-4 text-sm font-semibold text-slate-600 md:px-8">
          <a href="#rejoindre" className="whitespace-nowrap transition hover:text-blue-600">Rejoindre le réseau</a>
          <a href="#services" className="whitespace-nowrap transition hover:text-blue-600">Services</a>
          <a href="#evenements" className="whitespace-nowrap transition hover:text-blue-600">Événements</a>
          <a href="#contact-alumni" className="whitespace-nowrap transition hover:text-blue-600">Contact</a>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['01', 'Une communauté', 'Des promotions réunies autour de l’INPTIC'],
            ['02', 'Des opportunités', 'Des liens avec les entreprises et partenaires'],
            ['03', 'Un engagement', 'Des anciens qui accompagnent les étudiants'],
          ].map(([number, title, text]) => (
            <div key={number} className="border-l-4 border-cyan-500 bg-white p-6 shadow-sm">
              <p className="text-sm font-black text-cyan-600">{number}</p>
              <h2 className="mt-2 text-lg font-bold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div id="services" className="mb-10 max-w-2xl scroll-mt-24">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Le réseau INPTIC</p>
          <h2 className="mt-3 text-3xl font-black text-slate-900">Un lien durable entre l’école et le monde professionnel</h2>
          <p className="mt-4 leading-7 text-slate-600">Le réseau Alumni facilite les échanges entre générations, valorise les parcours et crée des passerelles concrètes vers l’emploi et l’entrepreneuriat.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: 'Garder le contact',
              text: "Retrouvez les anciens étudiants, enseignants et partenaires de l'INPTIC au sein d'une même communauté.",
            },
            {
              title: 'Partager les opportunités',
              text: "Faites circuler les offres d'emploi, les stages, les projets et les événements utiles à votre réseau.",
            },
            {
              title: 'Accompagner les étudiants',
              text: "Transmettez votre expérience et contribuez à l'insertion professionnelle des nouvelles promotions.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="rejoindre" className="bg-slate-900 text-white scroll-mt-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1fr_0.8fr] md:items-center md:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Rejoindre Alumni</p>
            <h2 className="mt-3 text-3xl font-black">Faites connaître votre parcours</h2>
            <p className="mt-5 max-w-xl leading-7 text-slate-300">Anciens étudiants, partagez votre actualité, vos compétences ou vos opportunités avec la communauté INPTIC.</p>
          </div>
          <div className="bg-white p-7 text-slate-900 shadow-xl">
            <h3 className="text-xl font-bold">Votre prochaine étape</h3>
            <ol className="mt-5 space-y-4 text-sm text-slate-600">
              <li><strong className="text-slate-900">1. Prenez contact</strong><br />Présentez votre promotion et votre parcours.</li>
              <li><strong className="text-slate-900">2. Partagez votre actualité</strong><br />Proposez une opportunité, un témoignage ou un événement.</li>
              <li><strong className="text-slate-900">3. Construisez le réseau</strong><br />Contribuez aux échanges entre étudiants et diplômés.</li>
            </ol>
            <a href="/contact" className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">Contacter l&apos;équipe Alumni</a>
          </div>
        </div>
      </section>

      <section id="evenements" className="bg-white scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Vie du réseau</p>
          <h2 className="mt-3 text-3xl font-black text-slate-900">Les rendez-vous Alumni</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              ['Rencontres professionnelles', 'Échanger avec des diplômés et des partenaires autour des métiers du numérique.'],
              ['Mentorat', 'Accompagner les étudiants dans leurs choix, leurs projets et leur insertion.'],
              ['Témoignages de parcours', 'Mettre en lumière les expériences et les réussites des anciens.'],
            ].map(([title, text]) => (
              <article key={title} className="border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact-alumni" className="bg-slate-50 scroll-mt-24">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center md:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Une communauté active</p>
          <h2 className="mt-3 text-3xl font-black text-slate-900">Votre parcours continue avec l&apos;INPTIC</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">La page Alumni est l&apos;espace de référence pour valoriser les parcours, créer des liens entre promotions et rapprocher l&apos;institut du monde professionnel.</p>
          <a href="/contact" className="mt-8 inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">Contacter l&apos;INPTIC</a>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center md:px-8">
          <p className="text-sm text-slate-600">Retrouvez les événements et annonces du réseau INPTIC.</p>
          <a href="/actualites" className="mt-3 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
            Voir toutes les actualités
          </a>
        </div>
      </section>
    </main>
  );
}
