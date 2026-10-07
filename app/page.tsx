"use client";

import Hero from "@/components/Hero";
import AnnouncementsCarousel from "@/components/AnnouncementsCarousel";
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  CalendarDays,
  Users,
  BookOpen,
  Globe2,
  BriefcaseBusiness,
} from "lucide-react";
export default function Home() {
  const { t } = useTranslation();
  const formations = [
    [t('home.informatique'), t('home.informatiqueText'), "/formations/genie-logiciel"],
    [t('home.multimedia'), t('home.multimediaText'), "/formations"],
    [t('home.telecom'), t('home.telecomText'), "/formations/telecoms"],
    [t('home.management'), t('home.managementText'), "/formations"],
  ];

  return (
    <>
      <AnnouncementsCarousel />
      <Hero />
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
            <article className="md:col-span-2 rounded-2xl overflow-hidden bg-slate-900 text-white p-8 min-h-72">
              <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                {t('home.event')}
              </span>
              <h3 className="text-3xl font-bold mt-20">
                {t('home.innovationWeek')}
              </h3>
              <p className="mt-2">
                {t('home.innovationText')}
              </p>
            </article>
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

              <article className="border rounded-xl p-5 bg-white">
                <b>{t('home.clubs')}</b>
                <p className="text-sm text-slate-500 mt-2">
                  {t('home.clubsText')}
                </p>
              </article>
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
            {formations.map(([title, description, href]) => (
              <article
                key={title}
                className="bg-white border rounded-2xl p-5 hover:shadow-lg transition"
              >
                <div className="h-28 bg-slate-100 rounded-xl mb-5" />
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
          className="my-12 bg-slate-950 text-white rounded-3xl p-10 grid md:grid-cols-3 gap-8"
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
            <h3 className="font-bold">{t('home.agenda')}</h3>
            <p className="mt-4">28 MAI — {t('home.openDay')}</p>
            <p className="mt-4">05 JUIN — {t('home.companiesForum')}</p>
            <p className="mt-4">12 JUIN — {t('home.aiConference')}</p>
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
