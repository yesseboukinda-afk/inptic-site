const partners = [
  { name: 'CNOU', category: 'Institution publique', logo: '/partners/cnou.png', url: 'https://www.cnou.ga/' },
  { name: 'Cisco', category: 'Technologie', logo: '/partners/cisco.png', url: 'https://www.cisco.com/' },
  { name: 'Moov Africa', category: 'Télécommunications', logo: '/partners/moov-africa.jpg', url: 'https://www.moov-africa.ga/' },
  { name: 'SPIN', category: 'Innovation', logo: '/partners/spin.png', url: 'https://spin-gabon.com/' },
  { name: 'Comilog', category: 'Industrie', logo: '/partners/comilog.png', url: 'https://www.comilog.com/' },
  { name: 'Ministère', category: 'Administration', logo: '/partners/minister.png', url: 'https://www.gouvernement.ga/' },
  { name: 'ANBG', category: 'Institution nationale', logo: '/partners/anbg.png', url: 'https://www.anbg.ga/' },
  { name: 'Arcep', category: 'Régulation', logo: '/partners/arcep.png', url: 'https://www.arcep.ga/' },
];

export default function Partenariats() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-r from-slate-900 to-blue-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">INPTIC Gabon</p>
          <h1 className="text-4xl font-black md:text-6xl">Partenariats</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            L’INPTIC Gabon s’appuie sur des partenariats solides avec des institutions, des entreprises et des acteurs technologiques afin de renforcer la qualité de la formation, la recherche et l’insertion professionnelle.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Qui sommes-nous</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Des collaborations utiles à la formation</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Nos partenaires jouent un rôle central dans la conception des programmes, la mise à jour des contenus pédagogiques, le développement des projets de recherche et l’accompagnement des étudiants vers le marché professionnel.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Ces alliances permettent à l’INPTIC de rester en phase avec les réalités du terrain, d’ouvrir les étudiants aux opportunités du numérique et de contribuer à la transformation numérique du Gabon.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">Nos engagements</h3>
            <ul className="mt-6 space-y-4 text-slate-600">
              <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" /><span>Accompagnement des étudiants dans leur parcours académique et professionnel.</span></li>
              <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" /><span>Renforcement de la qualité et de la pertinence pédagogique.</span></li>
              <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" /><span>Développement de projets innovants et de collaborations industrielles.</span></li>
              <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" /><span>Ouverture internationale et échange de bonnes pratiques.</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Nos partenaires</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Ils nous font confiance</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {partners.map((partner) => (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-20 items-center justify-center overflow-hidden rounded-xl bg-white p-3">
                  <img src={partner.logo} alt={partner.name} className="max-h-14 w-auto object-contain" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{partner.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{partner.category}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
