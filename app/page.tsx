"use client";

import Hero from "@/components/Hero";
import AnnouncementsCarousel from "@/components/AnnouncementsCarousel";
import HomeAgenda from "@/components/HomeAgenda";
import LatestYoutubeVideo from "@/components/LatestYoutubeVideo";
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Users,
  BookOpen,
  Globe2,
  BriefcaseBusiness,
} from "lucide-react";
import { connection } from "next/server";

export default async function Home() {
  await connection();
  const { t } = useTranslation();
  const formations = [
    {
      title: t('home.informatique'),
      description: t('home.informatiqueText'),
      href: "/formations/genie-logiciel",
      image: "/formations/informatique.webp",
    },
    {
      title: t('home.multimedia'),
      description: t('home.multimediaText'),
      href: "/formations",
      image: "/formations/audiovisuel-1.webp",
    },
    {
      title: t('home.telecom'),
      description: t('home.telecomText'),
      href: "/formations/telecoms",
      image: "/formations/telecommunications.webp",
    },
    {
      title: t('home.management'),
      description: t('home.managementText'),
      href: "/formations",
      image: "/formations/management-tic.webp",
    },
  ];

  return (
    <>
      <div className="relative">
        <AnnouncementsCarousel />
        <Hero />
      </div>
      <main className="container-x">
        <section className="-mt-10 relative z-10 bg-white rounded-2xl shadow-xl grid grid-cols-2 md:grid-cols-6 gap-4 p-6 text-center">
          <div>
            <BookOpen className="mx-auto text-blue-600" />
            <b>{t('home.excellence')}</b>
            <p className="text-xs">{t('home.excellenceText')}</p>
          </div>
          <div>
            <Globe2 className="mx-auto text-blue-600" />
            <b>{t('home.research')}</b>
            <p className="text-xs">{t('home.researchText')}</p>
          </div>
          <div>
            <BriefcaseBusiness className="mx-auto text-blue-600" />
            <b>{t('home.employment')}</b>
            <p className="text-xs">{t('home.employmentText')}</p>
          </div>
          <div>
            <Users className="mx-auto text-blue-600" />
            <b>{t('home.campus')}</b>
            <p className="text-xs">{t('home.campusText')}</p>
          </div>
          <div>
            <Globe2 className="mx-auto text-blue-600" />
            <b>{t('home.international')}</b>
            <p className="text-xs">{t('home.internationalText')}</p>
          </div>
          <div>
            <BookOpen className="mx-auto text-blue-600" />
            <b>{t('home.academic')}</b>
            <p className="text-xs">{t('home.academicText')}</p>
          </div>
        </section>
        <section id="actualites" className="py-14">
          <div className="flex justify-between">
            <h2 className="text-3xl font-black">{t('home.highlights')}</h2>
            <a href="/actualites" className="text-blue-600">
              {t('home.allNews')}
            </a>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mt-6">
            <LatestYoutubeVideo />
            <div className="space-y-4">
              <Link
                href="/alumni"
                className="group block border rounded-xl p-5 hover:border-blue-500 hover:shadow-md transition bg-white"
              >
                <div className="flex items-center justify-between">
                  <b className="group-hover:text-blue-600 transition">{t('home.alumniLaunch')}</b>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  {t('home.alumniText')}
                </p>
              </Link>

              <Link
                href="/recherche/publications"
                className="group block border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 rounded-xl p-5 hover:border-blue-500 hover:shadow-md transition ring-1 ring-blue-500/10"
              >
                <div className="flex items-center justify-between">
                  <b className="text-blue-900 group-hover:text-blue-600 transition">{t('home.researchers')}</b>
                  <ArrowRight size={16} className="text-blue-600 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  {t('home.researchersText')}
                </p>
                <span className="inline-block mt-3 text-xs font-bold text-blue-600 group-hover:underline">
                  Découvrir les travaux &amp; publications →
                </span>
              </Link>

              <Link
                href="/clubs"
                className="group block border rounded-xl p-5 bg-white hover:border-blue-500 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <b className="group-hover:text-blue-600 transition">{t('home.clubs')}</b>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" aria-hidden="true" />
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  {t('home.clubsText')}
                </p>
                <span className="inline-block mt-3 text-xs font-bold text-blue-600 group-hover:underline">
                  Découvrir les clubs →
                </span>
              </Link>
            </div>
          </div>
        </section>
        <section id="formations" className="py-10">
          <div className="flex justify-between">
            <h2 className="text-3xl font-black">{t('home.formations')}</h2>
            <a href="/formations" className="text-blue-600">
              {t('home.allFormations')}
            </a>
          </div>
          <div className="grid md:grid-cols-4 gap-5 mt-6">
            {formations.map(({ title, description, href, image }) => (
              <article
                key={title}
                className="bg-white border rounded-2xl p-5 hover:shadow-lg transition"
              >
                <div className="relative h-28 overflow-hidden rounded-xl mb-5">
                  <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                </div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-sm text-slate-500 mt-2 min-h-12">{description}</p>
                <p className="text-xs mt-4">{t('home.diploma')}</p>
                <a
                  href={href}
                  className="text-blue-600 text-sm font-semibold mt-5 inline-block"
                >
                  {t('home.learnMore')}
                </a>
              </article>
            ))}
          </div>
        </section>
        <section
          id="admissions"
          className="my-12 overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.10),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.10),_transparent_30%),linear-gradient(135deg,#0b1220_0%,#111827_45%,#0f172a_100%)] p-10 text-white shadow-[0_18px_45px_rgba(15,23,42,0.35)] grid md:grid-cols-3 gap-8"
        >
          <div>
            <h2 className="text-3xl font-black">{t('home.apply')}</h2>
            <p className="text-slate-300 mt-3">
              {t('home.applyText')}
            </p>
            <a
              href="/candidat"
              className="inline-block mt-6 bg-blue-600 px-5 py-3 rounded-lg"
            >
              {t('home.start')}
            </a>
          </div>
          <div>
            <HomeAgenda />
          </div>
          <div>
            <h3 className="font-bold">{t('home.keyFigures')}</h3>
            <div className="grid grid-cols-2 gap-5 mt-5">
              <b>
                +20
                <br />
                <small className="font-normal text-slate-400">{t('home.trainingCount')}</small>
              </b>
              <b>
                +3 000
                <br />
                <small className="font-normal text-slate-400">{t('home.studentCount')}</small>
              </b>
              <b>
                +150
                <br />
                <small className="font-normal text-slate-400">
                  {t('home.teacherCount')}
                </small>
              </b>
              <b>
                +95%
                <br />
                <small className="font-normal text-slate-400">
                  {t('home.employmentRate')}
                </small>
              </b>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
