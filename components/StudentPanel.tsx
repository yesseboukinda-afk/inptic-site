'use client';

import { BookOpen, BriefcaseBusiness, CalendarDays, FileCheck2, FileText, GraduationCap, UserRound, X } from 'lucide-react';
import type { CSSProperties } from 'react';

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

const sectionDetails: Record<StudentSection, { title: string; description: string; icon: typeof UserRound }> = {
  profil: { title: 'Profil', description: 'Vos informations personnelles et académiques.', icon: UserRound },
  cours: { title: 'Cours', description: 'Votre parcours et vos informations pédagogiques.', icon: BookOpen },
  'emploi-du-temps': { title: 'Emploi du temps', description: 'Votre calendrier de cours, examens et événements.', icon: CalendarDays },
  diplomes: { title: 'Diplômes', description: 'Vos diplômes obtenus et votre année de formation.', icon: GraduationCap },
  releves: { title: 'Relevés', description: 'Vos relevés de notes disponibles.', icon: FileText },
  stages: { title: 'Stages', description: 'Vos conventions et documents de stage.', icon: BriefcaseBusiness },
  attestations: { title: 'Attestations', description: 'Vos attestations de scolarité, stage et réussite.', icon: FileCheck2 },
};

export default function StudentPanel({ section, profile, sidebarCollapsed, onClose }: { section: StudentSection; profile: StudentProfile; sidebarCollapsed: boolean; onClose: () => void }) {
  const details = sectionDetails[section];
  const Icon = details.icon;
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
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Espace étudiant</p>
            <h2 id="student-panel-title" className="mt-1 text-2xl font-black text-slate-900">{details.title}</h2>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Fermer la rubrique" title="Fermer" className="border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <p className="mt-6 text-slate-600">Bonjour {profile.name || 'Étudiant'}. {details.description}</p>

      {section === 'profil' && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            ['Nom complet', profile.name], ['Email', profile.email], ['Téléphone', profile.phone],
            ['Niveau', profile.niveau], ['Parcours', profile.parcours], ['Promotion', profile.promotion],
            ['Année', profile.annee], ['Biographie', profile.bio],
          ].map(([label, value]) => <div key={label} className="border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-2 font-semibold text-slate-900">{value || 'À renseigner'}</p></div>)}
        </div>
      )}

      {section === 'cours' && <div className="mt-8 border border-blue-100 bg-blue-50 p-5"><p className="font-bold text-blue-900">Parcours : {profile.parcours || 'À renseigner'}</p><p className="mt-2 text-sm leading-6 text-slate-700">Le catalogue détaillé des cours sera publié ici par l’administration.</p></div>}
      {section === 'emploi-du-temps' && <div className="mt-8">{profile.emploiDuTemps?.length ? <ul className="space-y-3">{profile.emploiDuTemps.map((schedule) => { const source = schedule.url || schedule.data; return <li key={`${schedule.title}-${schedule.name}`} className="flex items-center justify-between gap-3 border border-slate-200 bg-slate-50 p-4"><div><p className="font-bold text-slate-900">{schedule.title}</p><p className="mt-1 text-sm text-slate-600">{schedule.name}</p></div>{source ? <a href={source} target="_blank" rel="noreferrer" className="border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Consulter</a> : null}</li>; })}</ul> : <div className="border border-slate-200 bg-slate-50 p-5"><p className="font-bold text-slate-900">Calendrier non publié</p><p className="mt-2 text-sm leading-6 text-slate-700">Votre emploi du temps apparaîtra ici dès sa mise à disposition.</p></div>}</div>}
      {section === 'diplomes' && <div className="mt-8 border border-slate-200 bg-slate-50 p-5"><p className="font-bold text-slate-900">{profile.diplome || 'Aucun diplôme enregistré'}</p><p className="mt-2 text-sm text-slate-600">Année : {profile.annee || 'À renseigner'}</p></div>}
      {(['releves', 'stages', 'attestations'] as StudentSection[]).includes(section) && <div className="mt-8">{matchingDocuments.length ? <ul className="space-y-3">{matchingDocuments.map((document) => <li key={`${document.name}-${document.type}`} className="flex items-center justify-between gap-3 border border-slate-200 bg-slate-50 p-4"><span className="truncate font-semibold text-slate-800">{document.name}</span><span className="text-xs font-bold uppercase text-blue-700">Document</span></li>)}</ul> : <div className="border border-slate-200 bg-slate-50 p-5"><p className="font-bold text-slate-900">Aucun document disponible</p><p className="mt-2 text-sm leading-6 text-slate-700">Les documents associés à cette rubrique apparaîtront ici après leur dépôt ou leur délivrance.</p></div>}</div>}
    </section>
  );
}
