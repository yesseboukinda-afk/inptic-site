const partnerLogos = [
  { name: 'CNOU', src: '/partners/cnou.png' },
  { name: 'Cisco', src: '/partners/cisco.png' },
  { name: 'Moov Africa', src: '/partners/moov-africa.jpg' },
  { name: 'SPIN', src: '/partners/spin.png' },
  { name: 'Comilog', src: '/partners/comilog.png' },
  { name: 'Ministère', src: '/partners/minister.png' },
  { name: 'ANBG', src: '/partners/anbg.png' },
  { name: 'Arcep', src: '/partners/arcep.png' },
];

export default function Entreprises() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="relative isolate overflow-hidden text-white">
          <img src="/banniere/5.webp" alt="" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
          <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
        <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
          <h1 className="text-4xl font-black md:text-6xl">Espace entreprises</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            L’INPTIC Gabon collabore avec des acteurs clés du numérique et de l’économie pour offrir à nos étudiants les meilleures opportunités de formation, d’innovation et d’insertion professionnelle.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Insertion professionnelle</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Nos diplômés trouvent rapidement un emploi grâce à notre réseau de partenaires</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Nos diplômés trouvent rapidement un emploi grâce à notre réseau de partenaires et à la qualité de notre formation.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Des programmes académiques de haut niveau adaptés aux besoins du marché, avec des partenariats industriels pour répondre aux besoins du marché.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">Nos services pour les entreprises</h3>
            <ul className="mt-6 space-y-5 text-slate-700">
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>Recrutement de profils numériques qualifiés</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>Stages et projets de fin d’études</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>Formations continues et accompagnement RH</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span>Innovation et développement de projets technologiques</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Nos partenariats</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Des acteurs qui accompagnent notre excellence</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {partnerLogos.map((partner) => (
              <div key={partner.name} className="flex min-h-[180px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <img
                  src={partner.src}
                  alt={partner.name}
                  className="max-h-20 w-full object-contain grayscale-[0.15]"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Nos chiffres</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Des résultats qui parlent d’eux-mêmes</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { value: '500+', label: 'Étudiants' },
              { value: '95%', label: 'Taux d’emploi' },
              { value: '15+', label: 'Partenaires' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
                <div className="text-4xl font-black text-blue-700">{stat.value}</div>
                <p className="mt-3 text-sm uppercase tracking-[0.14em] text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
