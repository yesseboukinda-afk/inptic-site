import Hero from "@/components/Hero";
import {
  ArrowRight,
  CalendarDays,
  Users,
  BookOpen,
  Globe2,
  BriefcaseBusiness,
} from "lucide-react";
const formations = [
  ["Informatique", "Développement logiciel, systèmes, réseaux et sécurité."],
  ["Multimédia & Internet", "Création numérique, web, design et audiovisuel."],
  ["Télécommunications", "Réseaux, systèmes embarqués, IoT et services."],
  [
    "Management & TIC",
    "Gestion de projet, marketing digital et entrepreneuriat.",
  ],
];
export default function Home() {
  return (
    <>
      <Hero />
      <main className="container-x">
        <section className="-mt-10 relative z-10 bg-white rounded-2xl shadow-xl grid grid-cols-2 md:grid-cols-6 gap-4 p-6 text-center">
          <div>
            <BookOpen className="mx-auto text-blue-600" />
            <b>Formations d'Excellences</b>
            <p className="text-xs">programmes de haut niveau</p>
          </div>
          <div>
            <Globe2 className="mx-auto text-blue-600" />
            <b>Recherche</b>
            <p className="text-xs">et innovation</p>
          </div>
          <div>
            <BriefcaseBusiness className="mx-auto text-blue-600" />
            <b>Insertion</b>
            <p className="text-xs">professionnelle</p>
          </div>
          <div>
            <Users className="mx-auto text-blue-600" />
            <b>Vie de</b>
            <p className="text-xs">campus</p>
          </div>
          <div>
            <Globe2 className="mx-auto text-blue-600" />
            <b>Ouvert à</b>
            <p className="text-xs">l’international</p>
          </div>
          <div>
            <BookOpen className="mx-auto text-blue-600" />
            <b>Excellence</b>
            <p className="text-xs">académique</p>
          </div>
        </section>
        <section id="actualites" className="py-14">
          <div className="flex justify-between">
            <h2 className="text-3xl font-black">À la une</h2>
            <a href="/actualites" className="text-blue-600">
              Toutes les actualités →
            </a>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mt-6">
            <article className="md:col-span-2 rounded-2xl overflow-hidden bg-slate-900 text-white p-8 min-h-72">
              <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                ÉVÉNEMENT
              </span>
              <h3 className="text-3xl font-bold mt-20">
                Semaine de l’innovation 2025
              </h3>
              <p className="mt-2">
                Conférences, ateliers et hackathons autour des technologies
                émergentes.
              </p>
            </article>
            <div className="space-y-4">
              <article className="border rounded-xl p-5">
                <b>Lancement de la plateforme INPTIC Alumni</b>
                <p className="text-sm text-slate-500 mt-2">
                  Rejoignez le réseau des diplômés.
                </p>
              </article>
              <article className="border rounded-xl p-5">
                <b>Nos chercheurs présentent leurs travaux</b>
                <p className="text-sm text-slate-500 mt-2">
                  Actualités de la recherche et de l’innovation.
                </p>
              </article>
              <article className="border rounded-xl p-5">
                <b>Clubs & associations</b>
                <p className="text-sm text-slate-500 mt-2">
                  Rejoignez la communauté étudiante.
                </p>
              </article>
            </div>
          </div>
        </section>
        <section id="formations" className="py-10">
          <div className="flex justify-between">
            <h2 className="text-3xl font-black">Nos formations</h2>
            <a href="/formations" className="text-blue-600">
              Voir toutes les formations →
            </a>
          </div>
          <div className="grid md:grid-cols-4 gap-5 mt-6">
            {formations.map(([t, d]) => (
              <article
                key={t}
                className="bg-white border rounded-2xl p-5 hover:shadow-lg transition"
              >
                <div className="h-28 bg-slate-100 rounded-xl mb-5" />
                <h3 className="font-bold text-lg">{t}</h3>
                <p className="text-sm text-slate-500 mt-2 min-h-12">{d}</p>
                <p className="text-xs mt-4">DTS · Licence</p>
                <a
                  href={"/formations/" + encodeURIComponent(t.toLowerCase())}
                  className="text-blue-600 text-sm font-semibold mt-5 inline-block"
                >
                  En savoir plus →
                </a>
              </article>
            ))}
          </div>
        </section>
        <section
          id="admissions"
          className="my-12 bg-slate-950 text-white rounded-3xl p-10 grid md:grid-cols-3 gap-8"
        >
          <div>
            <h2 className="text-3xl font-black">Candidater en ligne</h2>
            <p className="text-slate-300 mt-3">
              Créez votre compte, déposez vos pièces et suivez votre candidature
              en temps réel.
            </p>
            <a
              href="/candidat"
              className="inline-block mt-6 bg-blue-600 px-5 py-3 rounded-lg"
            >
              Commencer →
            </a>
          </div>
          <div>
            <h3 className="font-bold">Agenda</h3>
            <p className="mt-4">28 MAI — Journée portes ouvertes</p>
            <p className="mt-4">05 JUIN — Forum Entreprises & Stages</p>
            <p className="mt-4">12 JUIN — Conférence IA & Société</p>
          </div>
          <div>
            <h3 className="font-bold">Chiffres clés</h3>
            <div className="grid grid-cols-2 gap-5 mt-5">
              <b>
                +20
                <br />
                <small className="font-normal text-slate-400">formations</small>
              </b>
              <b>
                +3 000
                <br />
                <small className="font-normal text-slate-400">étudiants</small>
              </b>
              <b>
                +150
                <br />
                <small className="font-normal text-slate-400">
                  enseignants
                </small>
              </b>
              <b>
                +95%
                <br />
                <small className="font-normal text-slate-400">
                  insertion pro
                </small>
              </b>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
