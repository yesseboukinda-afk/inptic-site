export default function Institut() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <div
          className="absolute inset-y-0 right-0 z-0 w-1/2 scale-105 bg-cover bg-center brightness-110 saturate-110"
          style={{ backgroundImage: "url('/banniere/DG.jpg')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(7, 25, 55, 0.96) 0%, rgba(7, 25, 55, 0.72) 38%, rgba(0, 142, 174, 0.28) 70%, rgba(0, 142, 174, 0.08) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <div className="max-w-3xl">
            <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
            <h1 className="text-4xl font-black md:text-6xl">L’Institut</h1>
            <p className="mt-5 text-lg text-slate-200">
              Depuis sa création, l’INPTIC Gabon s’impose comme une référence dans la formation aux
              métiers du numérique, formant des professionnels compétents, innovants et engagés dans le
              développement économique du pays.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">À propos</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">À propos de l'INPTIC Gabon</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Depuis sa création, l'INPTIC Gabon s'impose comme une référence dans la formation aux métiers du numérique, formant des professionnels compétents et innovants.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              L'INPTIC Gabon a pour mission de former des professionnels du numérique hautement qualifiés, capables de répondre aux défis technologiques contemporains et de contribuer au développement économique du Gabon.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">Notre Mission</h3>
            <p className="mt-5 leading-7 text-slate-600">
              L'INPTIC Gabon a pour mission de former des professionnels du numérique hautement qualifiés, capables de répondre aux défis technologiques contemporains et de contribuer au développement économique du Gabon.
            </p>
            <div className="mt-8 rounded-2xl bg-blue-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Message du Directeur</p>
              <blockquote className="mt-4 text-lg leading-8 text-slate-800">
                « L'excellence académique et l'innovation pédagogique sont au cœur de notre approche pour former les leaders numériques de demain. »
              </blockquote>
              <p className="mt-3 font-semibold text-slate-900">Landry BADIALI</p>
              <p className="text-sm text-slate-600">Directeur Général</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Nos atouts</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Des fondements solides pour votre réussite</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: 'Encadrement personnalisé', text: 'Un accompagnement individualisé pour chaque étudiant à chaque étape de son parcours.' },
              { title: 'Certifications reconnues', text: 'Des diplômes et certifications reconnus par l’État et les entreprises.' },
              { title: 'Ouverture internationale', text: 'Des partenariats avec des universités et acteurs du monde entier.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-7 shadow-sm">
                <div className="mb-4 h-12 w-12 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center text-xl font-black">✓</div>
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
