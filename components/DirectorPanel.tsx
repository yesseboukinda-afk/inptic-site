"use client";

import { Bell, ClipboardList, Users, X } from "lucide-react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { translateNotification } from "@/lib/authMessages";

type Notification = { id: string; message: string; type: "info" | "success" | "warning" | "danger"; createdAt: string };
type StudentProfile = { email: string; name: string; phone?: string; niveau?: string; parcours?: string; promotion?: string; etablissement?: string; annee?: string; specialite?: string; bio?: string; diplome?: string; photo?: string; filiere?: string; dossierNumero?: string; documents?: Array<{ name: string; type: string; data?: string; url?: string; path?: string }>; role?: string; dossierValide?: boolean; status?: "inscription" | "en_attente" | "valide" | "refuse"; notifications?: Notification[] };
export type DirectorSection = "etudiants" | "dossiers" | "notifications";
type Props = { section: DirectorSection; students: StudentProfile[]; selected: StudentProfile | null; sidebarCollapsed: boolean; onSelectStudent: (student: StudentProfile) => void; onUpdateStatus: (decision: "valide" | "refuse") => void; onClose: () => void };

export default function DirectorPanel({ section, students, selected, sidebarCollapsed, onSelectStudent, onUpdateStatus, onClose }: Props) {
  const { t } = useTranslation();
  const details = {
    etudiants: { key: "students", icon: Users },
    dossiers: { key: "files", icon: ClipboardList },
    notifications: { key: "notifications", icon: Bell },
  }[section];
  const Icon = details.icon;
  const statusLabel = (status?: StudentProfile["status"]) => status === "valide" ? t("directorDetail.approved") : status === "refuse" ? t("directorDetail.rejected") : t("directorDetail.pending");
  const fields = [
    [t("directorDashboard.fieldTrack"), selected?.filiere],
    [t("directorDashboard.fieldLevel"), selected?.niveau],
    [t("directorDashboard.fieldCohort"), selected?.promotion],
    [t("directorDashboard.fieldDiploma"), selected?.diplome],
    [t("directorDashboard.fieldPhone"), selected?.phone],
    [t("directorDashboard.fieldFile"), selected?.dossierNumero],
  ];

  return (
    <section className="director-panel absolute inset-x-0 top-0 z-40 h-fit max-h-[558px] overflow-y-auto border border-slate-200 bg-white p-6 shadow-2xl md:p-8 lg:right-0 lg:h-[558px] lg:left-[var(--director-panel-left)]" style={{ "--director-panel-left": sidebarCollapsed ? "106px" : "226px" } as CSSProperties} role="dialog" aria-modal="true" aria-labelledby="director-panel-title">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3"><Icon size={24} className="text-blue-700" aria-hidden="true" /><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">{t("directorDashboard.space")}</p><h2 id="director-panel-title" className="mt-1 text-2xl font-black text-slate-900">{t(`directorDashboard.${details.key}`)}</h2></div></div>
        <button type="button" onClick={onClose} aria-label={t("directorDashboard.close")} className="border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><X size={20} aria-hidden="true" /></button>
      </header>
      <p className="mt-6 text-slate-600">{t(`directorDashboard.${details.key}Description`)}</p>

      {section === "etudiants" && <div className="mt-6 space-y-3">{students.length ? students.map((student) => <button key={student.email} type="button" onClick={() => onSelectStudent(student)} className="flex w-full items-center gap-3 border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-blue-400 hover:bg-blue-50"><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{student.name || t("pages.student")}</p><p className="truncate text-xs text-slate-500">{student.email}</p></div><span className="ml-auto text-xs font-semibold text-blue-700">{statusLabel(student.status)}</span></button>) : <p className="border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">{t("directorDashboard.noProfile")}</p>}</div>}
      {section === "dossiers" && <div className="mt-6 space-y-3">{students.filter((student) => student.status !== "valide").map((student) => <div key={student.email} className="border border-slate-200 bg-slate-50 p-4"><p className="font-semibold text-slate-900">{student.name || t("pages.student")}</p><p className="mt-1 text-sm text-slate-600">{student.dossierNumero || t("directorDashboard.notAssigned")} · {statusLabel(student.status)}</p><button type="button" onClick={() => onSelectStudent(student)} className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-900">{t("directorDashboard.openFile")}</button></div>)}</div>}
      {section === "notifications" && <div className="mt-6 space-y-3">{students.flatMap((student) => (student.notifications || []).slice(0, 3).map((notification) => <div key={`${student.email}-${notification.id}`} className="border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">{student.name || student.email}</p><p className="mt-2 text-sm text-slate-800">{translateNotification(notification.message, t)}</p></div>))}</div>}

      {selected && <div className="mt-8 border-t border-slate-200 pt-6"><div className="flex items-center justify-between gap-4"><div><h3 className="text-xl font-bold text-slate-900">{selected.name || t("pages.student")}</h3><p className="text-sm text-slate-500">{selected.email}</p></div><span className="text-xs font-semibold uppercase text-blue-700">{statusLabel(selected.status)}</span></div><div className="mt-4 grid gap-3 md:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="border border-slate-200 bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-900">{value || t("directorDashboard.notProvided")}</p></div>)}</div><div className="mt-5 border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{t("directorDashboard.documents")}</p>{selected.documents?.length ? <ul className="mt-3 space-y-2">{selected.documents.map((document) => { const source = document.url || document.data || (document.path && process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dossier_documents/${document.path}` : ""); return <li key={`${document.name}-${document.type}`} className="flex items-center gap-3 border border-slate-200 bg-white p-3"><span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{document.name}</span>{source ? <a href={source} target="_blank" rel="noreferrer" className="shrink-0 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">{t("directorDashboard.view")}</a> : <span className="text-xs text-slate-500">{t("directorDetail.resync")}</span>}</li>; })}</ul> : <p className="mt-3 text-sm text-slate-500">{t("directorDetail.noSupporting")}</p>}</div>{selected.status !== "valide" && selected.status !== "refuse" && <div className="mt-4 flex gap-3"><button type="button" onClick={() => onUpdateStatus("valide")} className="bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">{t("directorDashboard.accept")}</button><button type="button" onClick={() => onUpdateStatus("refuse")} className="bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">{t("directorDashboard.reject")}</button></div>}</div>}
    </section>
  );
}
