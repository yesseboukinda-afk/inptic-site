'use client';

import { Bell, ClipboardList, FileText, Users, X } from 'lucide-react';
import type { CSSProperties } from 'react';

type Notification = { id: string; message: string; type: 'info' | 'success' | 'warning' | 'danger'; createdAt: string };
type StudentProfile = { email: string; name: string; phone?: string; niveau?: string; parcours?: string; promotion?: string; etablissement?: string; annee?: string; specialite?: string; bio?: string; diplome?: string; photo?: string; filiere?: string; dossierNumero?: string; documents?: Array<{ name: string; type: string; data?: string; url?: string; path?: string }>; role?: string; dossierValide?: boolean; status?: 'inscription' | 'en_attente' | 'valide' | 'refuse'; dossierStep?: 'inscription' | 'en_attente' | 'valide' | 'refuse'; notifications?: Notification[] };
export type DirectorSection = 'etudiants' | 'dossiers' | 'notifications' | 'profil';

type Props = { section: DirectorSection; students: StudentProfile[]; selected: StudentProfile | null; sidebarCollapsed: boolean; onSelectStudent: (student: StudentProfile) => void; onUpdateStatus: (decision: 'valide' | 'refuse') => void; onClose: () => void };

const details = {
  etudiants: { title: 'Étudiants', icon: Users, description: 'Consultez les profils enregistrés.' },
  dossiers: { title: 'Dossiers', icon: ClipboardList, description: 'Examinez et traitez les candidatures.' },
  notifications: { title: 'Notifications', icon: Bell, description: 'Suivez les messages envoyés aux candidats.' },
  profil: { title: 'Profil DG', icon: FileText, description: 'Informations de votre espace directeur.' },
};

export default function DirectorPanel({ section, students, selected, sidebarCollapsed, onSelectStudent, onUpdateStatus, onClose }: Props) {
  const current = details[section];
  const Icon = current.icon;
  return (
    <section className="director-panel absolute inset-x-0 top-0 z-40 h-fit max-h-[558px] overflow-y-auto border border-slate-200 bg-white p-6 shadow-2xl md:p-8 lg:right-0 lg:h-[558px] lg:left-[var(--director-panel-left)]" style={{ '--director-panel-left': sidebarCollapsed ? '106px' : '226px' } as CSSProperties} role="dialog" aria-modal="true" aria-labelledby="director-panel-title">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3"><Icon size={24} className="text-blue-700" aria-hidden="true" /><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Espace directeur</p><h2 id="director-panel-title" className="mt-1 text-2xl font-black text-slate-900">{current.title}</h2></div></div>
        <button type="button" onClick={onClose} aria-label="Fermer la rubrique" className="border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><X size={20} aria-hidden="true" /></button>
      </div>
      <p className="mt-6 text-slate-600">{current.description}</p>

      {section === 'etudiants' && <div className="mt-6 space-y-3">{students.length ? students.map((student) => <button key={student.email} type="button" onClick={() => onSelectStudent(student)} className={`flex w-full items-center gap-3 border p-3 text-left transition hover:border-blue-400 hover:bg-blue-50 ${selected?.email === student.email ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{student.name || 'Étudiant'}</p><p className="truncate text-xs text-slate-500">{student.email}</p></div><span className="ml-auto text-xs font-semibold text-blue-700">{student.status || 'en_attente'}</span></button>) : <p className="border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">Aucun profil enregistré.</p>}</div>}

      {section === 'dossiers' && <div className="mt-6 space-y-3">{students.filter((student) => student.status !== 'valide').map((student) => <div key={student.email} className="border border-slate-200 bg-slate-50 p-4"><p className="font-semibold text-slate-900">{student.name || 'Étudiant'}</p><p className="mt-1 text-sm text-slate-600">{student.dossierNumero || 'Numéro non attribué'} · {student.status || 'en_attente'}</p><button type="button" onClick={() => { onSelectStudent(student); }} className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-900">Ouvrir le dossier →</button></div>)}</div>}

      {section === 'notifications' && <div className="mt-6 space-y-3">{students.flatMap((student) => (student.notifications || []).slice(0, 3).map((notification) => <div key={`${student.email}-${notification.id}`} className="border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">{student.name || student.email}</p><p className="mt-2 text-sm text-slate-800">{notification.message}</p></div>))}</div>}

      {section === 'profil' && <div className="mt-6 border border-slate-200 bg-slate-50 p-5"><p className="font-bold text-slate-900">Directeur général</p><p className="mt-2 text-sm text-slate-600">Gestion des candidatures, validation des dossiers et suivi des étudiants.</p></div>}

      {selected && section !== 'profil' && <div className="mt-8 border-t border-slate-200 pt-6"><div className="flex items-center justify-between gap-4"><div><h3 className="text-xl font-bold text-slate-900">{selected.name || 'Étudiant'}</h3><p className="text-sm text-slate-500">{selected.email}</p></div><span className="text-xs font-semibold uppercase text-blue-700">{selected.status || 'en_attente'}</span></div><div className="mt-4 grid gap-3 md:grid-cols-2">{[['Filière', selected.filiere], ['Niveau', selected.niveau], ['Promotion', selected.promotion], ['Diplôme', selected.diplome], ['Téléphone', selected.phone], ['Dossier', selected.dossierNumero]].map(([label, value]) => <div key={label} className="border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-900">{value || 'À renseigner'}</p></div>)}</div><div className="mt-5 border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Pièces justificatives</p>{selected.documents?.length ? <ul className="mt-3 space-y-2">{selected.documents.map((document) => { const storageUrl = document.path && process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dossier_documents/${document.path}` : ''; const source = document.url || document.data || storageUrl; const isImage = document.type.startsWith('image/'); return <li key={`${document.name}-${document.type}`} className="flex items-center gap-3 border border-slate-200 bg-white p-3"><span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{document.name}</span>{isImage && source && <img src={source} alt="" className="h-10 w-10 object-cover" />}{source ? <a href={source} target="_blank" rel="noreferrer" className="shrink-0 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">Consulter</a> : <span className="text-xs text-slate-500">Document à resynchroniser</span>}</li>; })}</ul> : <p className="mt-3 text-sm text-slate-500">Aucune pièce justificative téléversée.</p>}</div>{selected.status !== 'valide' && selected.status !== 'refuse' && <div className="mt-4 flex gap-3"><button type="button" onClick={() => onUpdateStatus('valide')} className="bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">Accepter</button><button type="button" onClick={() => onUpdateStatus('refuse')} className="bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Refuser</button></div>}</div>}
    </section>
  );
}
