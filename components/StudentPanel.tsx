'use client';

import { BookOpen, BriefcaseBusiness, CalendarDays, FileCheck2, FileText, GraduationCap, UserRound, X } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

type StudentProfile = {
  name?: string;
  email?: string;
  phone?: string;
  niveau?: string;
  parcours?: string;
  promotion?: string;
  annee?: string;
  diplome?: string;
  bio?: string;
  documents?: Array<{ name: string; type: string; data?: string }>;
  emploiDuTemps?: Array<{ title: string; name: string; type: string; data?: string; url?: string }>;
};

export type StudentSection = 'profil' | 'cours' | 'emploi-du-temps' | 'diplomes' | 'releves' | 'stages' | 'attestations';

const sectionIcons: Record<StudentSection, typeof UserRound> = {
  profil: UserRound,
  cours: BookOpen,
  'emploi-du-temps': CalendarDays,
  diplomes: GraduationCap,
  releves: FileText,
  stages: BriefcaseBusiness,
  attestations: FileCheck2,
};

export default function StudentPanel({ section, profile, sidebarCollapsed, onClose }: { section: StudentSection; profile: StudentProfile; sidebarCollapsed: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const sectionKeys = { profil: 'profile', cours: 'courses', 'emploi-du-temps': 'schedule', diplomes: 'degrees', releves: 'transcripts', stages: 'internships', attestations: 'certificates' } as const;
  const details = { title: t(`studentDashboard.${sectionKeys[section]}`), description: t(`studentDashboard.${sectionKeys[section]}Description`) };
  const Icon = sectionIcons[section];
  const documents = profile.documents || [];
  const matchingDocuments = section === 'releves'
    ? documents.filter((document) => /releve|notes?/i.test(document.name))
    : section === 'attestations'
      ? documents.filter((document) => /attestation|certificat/i.test(document.name))
      : section === 'stages'
        ? documents.filter((document) => /stage|convention/i.test(document.name))
        : documents;

  return (
    <section
      className="student-panel absolute inset-x-0 top-0 z-40 h-fit max-h-[558px] w-auto overflow-y-auto border border-slate-200 bg-white p-6 shadow-2xl md:p-8 lg:right-0 lg:h-[558px] lg:left-[var(--student-panel-left)]"
      style={{ '--student-panel-left': sidebarCollapsed ? '106px' : '226px' } as CSSProperties}
      aria-modal="true"
      role="dialog"
      aria-labelledby="student-panel-title"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Icon size={24} className="text-blue-700" aria-hidden="true" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">{t('studentDashboard.space')}</p>
            <h2 id="student-panel-title" className="mt-1 text-2xl font-black text-slate-900">{details.title}</h2>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label={t('studentDashboard.close')} title={t('studentDashboard.closeTitle')} className="border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <p className="mt-6 text-slate-600">{t('studentDashboard.hello', { name: profile.name || t('pages.student') })} {details.description}</p>

      {section === 'profil' && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            [t('studentDashboard.fullName'), profile.name], [t('studentDashboard.email'), profile.email], [t('studentDashboard.phone'), profile.phone],
            [t('studentDashboard.level'), profile.niveau], [t('studentDashboard.program'), profile.parcours], [t('studentDashboard.cohort'), profile.promotion],
            [t('studentDashboard.year'), profile.annee], [t('studentDashboard.bio'), profile.bio],
          ].map(([label, value]) => <div key={label} className="border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-2 font-semibold text-slate-900">{value || t('studentDashboard.notProvided')}</p></div>)}
        </div>
      )}

      {section === 'cours' && <div className="mt-8 border border-blue-100 bg-blue-50 p-5"><p className="font-bold text-blue-900">{t('studentDashboard.program')} : {profile.parcours || t('studentDashboard.notProvided')}</p><p className="mt-2 text-sm leading-6 text-slate-700">{t('studentDashboard.courseCatalog')}</p></div>}
      {section === 'emploi-du-temps' && <div className="mt-8">{profile.emploiDuTemps?.length ? <ul className="space-y-3">{profile.emploiDuTemps.map((schedule) => { const source = schedule.url || schedule.data; return <li key={`${schedule.title}-${schedule.name}`} className="flex items-center justify-between gap-3 border border-slate-200 bg-slate-50 p-4"><div><p className="font-bold text-slate-900">{schedule.title}</p><p className="mt-1 text-sm text-slate-600">{schedule.name}</p></div>{source ? <a href={source} target="_blank" rel="noreferrer" className="border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Consulter</a> : null}</li>; })}</ul> : <div className="border border-slate-200 bg-slate-50 p-5"><p className="font-bold text-slate-900">Calendrier non publié</p><p className="mt-2 text-sm leading-6 text-slate-700">Votre emploi du temps apparaîtra ici dès sa mise à disposition.</p></div>}</div>}
      {section === 'diplomes' && <div className="mt-8 border border-slate-200 bg-slate-50 p-5"><p className="font-bold text-slate-900">{profile.diplome || t('studentDashboard.noDegree')}</p><p className="mt-2 text-sm text-slate-600">{t('studentDashboard.year')} : {profile.annee || t('studentDashboard.notProvided')}</p></div>}
      {(['releves', 'stages', 'attestations'] as StudentSection[]).includes(section) && <div className="mt-8">{matchingDocuments.length ? <ul className="space-y-3">{matchingDocuments.map((document) => <li key={`${document.name}-${document.type}`} className="flex items-center justify-between gap-3 border border-slate-200 bg-slate-50 p-4"><span className="truncate font-semibold text-slate-800">{document.name}</span><span className="text-xs font-bold uppercase text-blue-700">{t('studentDashboard.document')}</span></li>)}</ul> : <div className="border border-slate-200 bg-slate-50 p-5"><p className="font-bold text-slate-900">{t('studentDashboard.noDocument')}</p><p className="mt-2 text-sm leading-6 text-slate-700">{t('studentDashboard.documentUnavailable')}</p></div>}</div>}
    </section>
  );
}
