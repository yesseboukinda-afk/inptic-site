'use client';

import { BookOpen, BriefcaseBusiness, CalendarDays, FileCheck2, FileText, GraduationCap, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

type StudentProfile = {
  name?: string;
  email?: string;
  niveau?: string;
  parcours?: string;
  promotion?: string;
  annee?: string;
  diplome?: string;
  documents?: Array<{ name: string; type: string; data?: string }>;
};

type SectionKey = 'profil' | 'cours' | 'emploi-du-temps' | 'diplomes' | 'releves' | 'stages' | 'attestations';

type SectionConfig = {
  titleKey: string;
  descriptionKey: string;
  icon: typeof UserRound;
};

const sections: Record<SectionKey, SectionConfig> = {
  profil: { titleKey: 'profile', descriptionKey: 'profileDescription', icon: UserRound },
  cours: { titleKey: 'courses', descriptionKey: 'coursesDescription', icon: BookOpen },
  'emploi-du-temps': { titleKey: 'schedule', descriptionKey: 'scheduleDescription', icon: CalendarDays },
  diplomes: { titleKey: 'degrees', descriptionKey: 'degreesDescription', icon: GraduationCap },
  releves: { titleKey: 'transcripts', descriptionKey: 'transcriptsDescription', icon: FileText },
  stages: { titleKey: 'internships', descriptionKey: 'internshipsDescription', icon: BriefcaseBusiness },
  attestations: { titleKey: 'certificates', descriptionKey: 'certificatesDescription', icon: FileCheck2 },
};

export default function StudentSectionPage({ section }: { section: SectionKey }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const config = sections[section];
  const Icon = config.icon;

  useEffect(() => {
    const stored = localStorage.getItem('inptic_user');
    if (!stored) {
      router.replace('/candidat');
      return;
    }

    try {
      const parsed = JSON.parse(stored) as StudentProfile & { dossierValide?: boolean; status?: string };
      if (parsed.dossierValide !== true && parsed.status !== 'valide') {
        router.replace('/admissions/suivi');
        return;
      }
      setProfile(parsed);
    } catch {
      router.replace('/candidat');
    }
  }, [router]);

  if (!profile) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">{t('pages.accessCheck')}</main>;
  }

  const documents = profile.documents || [];
  const matchingDocuments = section === 'releves'
    ? documents.filter((document) => /releve|notes?/i.test(document.name))
    : section === 'attestations'
      ? documents.filter((document) => /attestation|certificat/i.test(document.name))
      : section === 'stages'
        ? documents.filter((document) => /stage|convention/i.test(document.name))
        : documents;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-8 lg:pl-[238px]">
          <div className="flex items-center gap-3">
            <Icon size={24} className="text-blue-700" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">{t('pages.studentSpace')}</p>
              <h1 className="text-xl font-bold text-slate-900">{t(`pages.${config.titleKey}`)}</h1>
            </div>
          </div>
          <Link href="/vie-etudiante" className="border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">{t('pages.backDashboard')}</Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 lg:pl-[238px]">
        <nav className="mb-6 border border-slate-200 bg-white p-3 lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:mb-0 lg:h-screen lg:w-[210px] lg:overflow-y-auto lg:p-5" aria-label={t('pages.studentSpace')}>
          {(Object.keys(sections) as SectionKey[]).map((key) => {
            const MenuIcon = sections[key].icon;
            return <Link key={key} href={`/vie-etudiante/${key}`} className={`flex items-center gap-3 border-l-2 px-3 py-3 text-sm font-semibold transition hover:bg-blue-50 hover:text-blue-700 ${key === section ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent text-slate-600'}`}><MenuIcon size={22} aria-hidden="true" />{t(`pages.${sections[key].titleKey}`)}</Link>;
          })}
        </nav>

        <section className="student-section-page border border-slate-200 bg-white p-6 md:p-8" aria-live="polite">
          <p className="text-sm text-slate-500">{t('pages.hello', { name: profile.name || t('pages.student') })}</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">{t(`pages.${config.titleKey}`)}</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">{t(`pages.${config.descriptionKey}`)}</p>

          {section === 'profil' && (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                [t('pages.fullName'), profile.name],
                [t('pages.email'), profile.email],
                [t('pages.level'), profile.niveau],
                [t('pages.program'), profile.parcours],
                [t('pages.cohort'), profile.promotion],
                [t('pages.year'), profile.annee],
              ].map(([label, value]) => <div key={label} className="border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-2 font-semibold text-slate-900">{value || t('pages.notProvided')}</p></div>)}
            </div>
          )}

          {section === 'cours' && <div className="mt-8 border border-blue-100 bg-blue-50 p-5"><p className="font-bold text-blue-900">Parcours : {profile.parcours || t('pages.notProvided')}</p><p className="mt-2 text-sm leading-6 text-slate-700">{t('pages.unavailable')}</p></div>}
          {section === 'emploi-du-temps' && <div className="mt-8 border border-slate-200 bg-slate-50 p-5"><p className="font-bold text-slate-900">{t('pages.schedule')}</p><p className="mt-2 text-sm leading-6 text-slate-700">{t('pages.unavailable')}</p></div>}
          {section === 'diplomes' && <div className="mt-8 border border-slate-200 bg-slate-50 p-5"><p className="font-bold text-slate-900">{profile.diplome || t('pages.noDocument')}</p><p className="mt-2 text-sm text-slate-600">{t('pages.notProvided')}</p></div>}
          {(['releves', 'stages', 'attestations'] as SectionKey[]).includes(section) && <div className="mt-8">{matchingDocuments.length ? <ul className="space-y-3">{matchingDocuments.map((document) => <li key={`${document.name}-${document.type}`} className="flex items-center justify-between gap-3 border border-slate-200 bg-slate-50 p-4"><span className="truncate font-semibold text-slate-800">{document.name}</span><span className="text-xs font-bold uppercase text-blue-700">{t('pages.document')}</span></li>)}</ul> : <div className="border border-slate-200 bg-slate-50 p-5"><p className="font-bold text-slate-900">{t('pages.noDocument')}</p><p className="mt-2 text-sm leading-6 text-slate-700">{t('pages.unavailable')}</p></div>}</div>}
        </section>
      </div>
    </main>
  );
}
