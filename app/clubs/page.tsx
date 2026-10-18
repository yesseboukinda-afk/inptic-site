'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronRight, Clapperboard, Clock3, CodeXml, Folder, FolderOpen, LoaderCircle, Network, Palette, Send, ShieldCheck, Sparkles, Trophy, UserRound, Users, X, type LucideIcon } from 'lucide-react';
import { CLUBS, findClubSubclub, type Club, type ClubSubclub } from '@/lib/clubs';

type Application = {
  id: string;
  clubSlug: string;
  subclubSlug: string | null;
  activity: string;
  motivation: string;
  status: 'pending' | 'accepted' | 'rejected';
  decisionNote?: string | null;
  createdAt: string;
  candidateName?: string;
  candidateEmail?: string;
};

type ClubData = {
  mode: 'student' | 'manager';
  clubSlug: string | 'all';
  applications: Application[];
};

type ClubMember = {
  clubSlug: string;
  subclubSlug: string;
  name: string;
};

const subclubIconComponents: Record<string, LucideIcon> = {
  developpement: CodeXml,
  reseau: Network,
  infographie: Palette,
  audiovisuel: Clapperboard,
};

const subclubEmojiIcons: Record<string, string> = {
  football: '⚽',
  taekwondo: '🥋',
  boxe: '🥊',
  karate: '🥋',
  basketball: '🏀',
};

function SubclubIcon({ slug, size = 20 }: { slug: string; size?: number }) {
  const emoji = subclubEmojiIcons[slug];
  if (emoji) {
    return (
      <span className="inline-flex shrink-0 items-center justify-center leading-none" style={{ width: size, height: size, fontSize: size * 0.9 }} aria-hidden="true">
        {emoji}
      </span>
    );
  }
  const Icon = subclubIconComponents[slug] || Users;
  return <Icon size={size} aria-hidden="true" />;
}

const statusLabels = {
  pending: 'En attente',
  accepted: 'Acceptée',
  rejected: 'Refusée',
} as const;

const statusClasses = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  accepted: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 ring-rose-200',
} as const;

export default function ClubsPage() {
  const [data, setData] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [motivation, setMotivation] = useState('');
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [selectedClubSlug, setSelectedClubSlug] = useState<string | null>(null);
  const [selectedSubclubSlug, setSelectedSubclubSlug] = useState<string | null>(null);
  const [supportsViewTransitions, setSupportsViewTransitions] = useState(false);

  useEffect(() => {
    setSupportsViewTransitions(typeof document.startViewTransition === 'function');
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/clubs/applications', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) {
        if (response.status !== 401) throw new Error(result.error || 'Impossible de charger les candidatures.');
        setData(null);
        return;
      }
      setData(result as ClubData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les candidatures.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const refreshMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const response = await fetch('/api/clubs/members', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Impossible de charger les membres des clubs.');
      setMembers(Array.isArray(result.members) ? result.members : []);
    } catch (membersError) {
      setError(membersError instanceof Error ? membersError.message : 'Impossible de charger les membres des clubs.');
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMembers();
  }, [refreshMembers]);

  const activeApplication = useMemo(
    () => data?.mode === 'student'
      ? data.applications.find((application) => application.status === 'pending' || application.status === 'accepted')
      : undefined,
    [data],
  );
  const visibleApplications = data?.mode === 'manager'
    ? data.applications
    : data?.applications ?? [];

  const submitApplication = async (clubSlug: string, subclubSlug: string) => {
    setSaving(subclubSlug);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/clubs/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubSlug, subclubSlug, motivation }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Impossible d’envoyer la candidature.');
      setMessage('Votre candidature a été envoyée au responsable du club.');
      setMotivation('');
      await refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Impossible d’envoyer la candidature.');
    } finally {
      setSaving('');
    }
  };

  const decideApplication = async (application: Application, decision: 'accepted' | 'rejected') => {
    const promptNote = decision === 'rejected'
      ? window.prompt('Motif du refus (facultatif, 500 caractères maximum) :')
      : '';
    if (promptNote === null) return;
    const note = promptNote;
    if (note.length > 500) {
      setError('Le motif ne peut pas dépasser 500 caractères.');
      return;
    }
    setSaving(application.id);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/clubs/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: application.id, decision, note }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Impossible de traiter la candidature.');
      setMessage(decision === 'accepted' ? 'Candidature acceptée.' : 'Candidature refusée.');
      await Promise.all([refresh(), ...(decision === 'accepted' ? [refreshMembers()] : [])]);
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : 'Impossible de traiter la candidature.');
    } finally {
      setSaving('');
    }
  };

  const clubBySlug = (slug: string): Club | undefined => CLUBS.find((club) => club.slug === slug);
  const selectedClub = clubBySlug(selectedClubSlug || '');
  const selectedSubclub = selectedClub?.subclubs.find((subclub) => subclub.slug === selectedSubclubSlug);
  const selectedSubclubMembers = members.filter(
    (member) => member.clubSlug === selectedClubSlug && member.subclubSlug === selectedSubclubSlug,
  );
  const selectedSubclubApplication = data?.mode === 'student'
    ? data.applications.find((application) =>
        application.clubSlug === selectedClubSlug && application.subclubSlug === selectedSubclubSlug)
    : undefined;

  const transitionExplorer = (update: () => void) => {
    if (typeof document.startViewTransition === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(() => flushSync(update));
      return;
    }
    update();
  };

  const showClub = (club: Club) => {
    transitionExplorer(() => {
      setSelectedClubSlug(club.slug);
      setSelectedSubclubSlug(null);
    });
  };

  const showSubclub = (subclub: ClubSubclub) => {
    transitionExplorer(() => setSelectedSubclubSlug(subclub.slug));
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 px-4 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Vie étudiante INPTIC</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">Clubs et associations</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
            Rejoignez une activité, partagez vos talents et réalisez des projets avec les autres étudiants.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {error && <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
        {message && <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}

        {data?.mode === 'manager' ? (
          <section className="mt-8 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="manager-heading">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-800"><ShieldCheck size={17} /> Espace responsable</p>
                <h2 id="manager-heading" className="mt-2 text-2xl font-bold text-slate-900">
                  {data.clubSlug === 'all' ? 'Candidatures de tous les clubs' : clubBySlug(data.clubSlug)?.name}
                </h2>
                <p className="mt-1 text-sm text-slate-600">Examinez les candidatures et acceptez ou refusez les demandes en attente.</p>
              </div>
              <button type="button" onClick={() => void refresh()} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Actualiser
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><LoaderCircle className="animate-spin text-blue-700" /></div>
            ) : visibleApplications.length === 0 ? (
              <p className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-600">Aucune candidature pour le moment.</p>
            ) : (
              <div className="mt-6 space-y-4">
                {visibleApplications.map((application) => {
                  const club = clubBySlug(application.clubSlug);
                  return (
                    <article key={application.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900">{application.candidateName || application.candidateEmail}</h3>
                          <p className="mt-0.5 text-sm text-slate-600">{application.candidateEmail}</p>
                          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-blue-800">
                            {application.subclubSlug && <SubclubIcon slug={application.subclubSlug} size={18} />}
                            {club?.name} · {findClubSubclub(application.clubSlug, application.subclubSlug)?.name || application.activity}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClasses[application.status]}`}>{statusLabels[application.status]}</span>
                      </div>
                      {application.motivation && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{application.motivation}</p>}
                      {application.decisionNote && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">Motif : {application.decisionNote}</p>}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <time className="text-xs text-slate-500" dateTime={application.createdAt}>{new Date(application.createdAt).toLocaleString('fr-FR')}</time>
                        {application.status === 'pending' && (
                          <div className="flex gap-2">
                            <button type="button" onClick={() => void decideApplication(application, 'rejected')} disabled={saving === application.id} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                              {saving === application.id ? <LoaderCircle size={15} className="animate-spin" /> : <X size={15} />} Refuser
                            </button>
                            <button type="button" onClick={() => void decideApplication(application, 'accepted')} disabled={saving === application.id} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                              {saving === application.id ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />} Accepter
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <>
            {activeApplication && (
              <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5" aria-live="polite">
                <div className="flex items-start gap-3">
                  {activeApplication.status === 'pending' ? <Clock3 className="mt-0.5 text-amber-700" /> : <Check className="mt-0.5 text-emerald-700" />}
                  <div>
                    <h2 className="font-bold text-slate-900">
                      {activeApplication.status === 'pending' ? 'Votre candidature est en attente' : 'Vous êtes membre de ce club'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-700">
                      {clubBySlug(activeApplication.clubSlug)?.name} · {findClubSubclub(activeApplication.clubSlug, activeApplication.subclubSlug)?.name || activeApplication.activity}.
                      {activeApplication.status === 'pending' ? ' Le responsable vous communiquera sa décision.' : ' Vous ne pouvez être inscrit qu’à un seul club à la fois.'}
                    </p>
                  </div>
                </div>
              </section>
            )}
            {!loading && !data && (
              <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
                <p className="text-sm leading-6 text-slate-700">Connectez-vous à votre compte étudiant pour envoyer une candidature et suivre son traitement.</p>
                <Link href="/candidat" className="rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-900">Se connecter</Link>
              </section>
            )}
            {data?.mode === 'student' && data.applications.some((application) => application.status === 'rejected') && !activeApplication && (
              <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Une précédente candidature a été refusée. Vous pouvez choisir un autre club et envoyer une nouvelle demande.
              </p>
            )}
            <section
              className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
              aria-label="Explorateur des clubs"
              style={{ viewTransitionName: 'club-explorer' }}
            >
              {!selectedClub ? (
                <div key="club-folders" className={`p-5 sm:p-8 ${supportsViewTransitions ? '' : 'club-pane-enter'}`}>
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Dossiers des clubs</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-900">Choisissez un club</h2>
                    <p className="mt-1 text-sm text-slate-600">Ouvrez un dossier pour parcourir ses sous-clubs.</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {CLUBS.map((club) => {
                      const Icon = club.icon === 'trophy' ? Trophy : Sparkles;
                      const memberCount = members.filter((member) => member.clubSlug === club.slug).length;
                      return (
                        <button
                          key={club.slug}
                          type="button"
                          onClick={() => showClub(club)}
                          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        >
                          <span className="rounded-2xl bg-blue-100 p-4 text-blue-800 transition group-hover:bg-blue-800 group-hover:text-white">
                            <Icon size={28} aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2 text-lg font-bold text-slate-900">
                              <Folder size={19} className="text-amber-500" aria-hidden="true" />
                              {club.name}
                            </span>
                            <span className="mt-1 block text-sm leading-5 text-slate-600">{club.description}</span>
                            <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                              <span>{club.subclubs.length} sous-clubs</span>
                              <span>{memberCount} membre{memberCount === 1 ? '' : 's'}</span>
                            </span>
                          </span>
                          <ChevronRight size={20} className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700" aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[520px] flex-col md:flex-row">
                  <aside className="w-full shrink-0 border-b border-slate-200 bg-slate-50 p-4 md:w-72 md:border-b-0 md:border-r md:p-5">
                    <button
                      type="button"
                      onClick={() => transitionExplorer(() => {
                        setSelectedClubSlug(null);
                        setSelectedSubclubSlug(null);
                      })}
                      className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-600 hover:bg-white hover:text-blue-800"
                    >
                      <ArrowLeft size={16} aria-hidden="true" /> Tous les clubs
                    </button>
                    <button
                      type="button"
                      onClick={() => transitionExplorer(() => setSelectedSubclubSlug(null))}
                      aria-current={!selectedSubclub ? 'page' : undefined}
                      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${!selectedSubclub ? 'bg-blue-100 text-blue-900 ring-1 ring-blue-200' : 'text-slate-700 hover:bg-white'}`}
                    >
                      <FolderOpen size={22} className="shrink-0 text-amber-500" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{selectedClub.name}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{selectedClub.subclubs.length} sous-clubs</span>
                      </span>
                    </button>
                    {selectedSubclub && (
                      <div className={`mt-2 flex items-center gap-3 rounded-xl bg-white p-3 text-blue-900 shadow-sm ring-1 ring-slate-200 ${supportsViewTransitions ? '' : 'club-pane-enter'}`}>
                        <SubclubIcon slug={selectedSubclub.slug} size={20} />
                        <span className="truncate text-sm font-semibold">{selectedSubclub.name}</span>
                      </div>
                    )}
                    <div className="mt-5 border-t border-slate-200 pt-4">
                      <p className="px-2 text-xs font-bold uppercase tracking-wide text-slate-500">Contenu du dossier</p>
                      <ul className="mt-2 space-y-1">
                        {selectedClub.subclubs.map((subclub) => (
                          <li key={subclub.slug}>
                            <button
                              type="button"
                              onClick={() => showSubclub(subclub)}
                              aria-current={selectedSubclubSlug === subclub.slug ? 'page' : undefined}
                              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${selectedSubclubSlug === subclub.slug ? 'bg-blue-100 font-semibold text-blue-900' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                            >
                              <SubclubIcon slug={subclub.slug} size={16} />
                              <span className="min-w-0 flex-1 truncate">{subclub.name}</span>
                              <span className="text-xs text-slate-400">
                                {members.filter((member) => member.clubSlug === selectedClub.slug && member.subclubSlug === subclub.slug).length}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </aside>

                  <div key={`${selectedClub.slug}-${selectedSubclub?.slug || 'folder'}`} className={`min-w-0 flex-1 p-5 sm:p-8 ${supportsViewTransitions ? '' : 'club-pane-enter'}`}>
                    {!selectedSubclub ? (
                      <div>
                        <div className="flex items-start gap-4">
                          <span className="rounded-2xl bg-amber-50 p-3 text-amber-600"><FolderOpen size={30} aria-hidden="true" /></span>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Dossier du club</p>
                            <h2 className="mt-1 text-3xl font-black text-slate-900">{selectedClub.name}</h2>
                            <p className="mt-2 max-w-2xl leading-6 text-slate-600">{selectedClub.description}</p>
                          </div>
                        </div>
                        <div className="mt-8 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                          <h3 className="font-bold text-slate-800">Sous-clubs</h3>
                          <span className="text-xs text-slate-500">Sélectionnez un dossier pour voir ses informations et ses membres</span>
                        </div>
                        <div className="mt-3 divide-y divide-slate-100">
                          {selectedClub.subclubs.map((subclub) => {
                            const count = members.filter((member) => member.clubSlug === selectedClub.slug && member.subclubSlug === subclub.slug).length;
                            return (
                              <button
                                key={subclub.slug}
                                type="button"
                                onClick={() => showSubclub(subclub)}
                                className="group flex w-full items-center gap-4 rounded-lg px-3 py-4 text-left transition hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                              >
                                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                                  <SubclubIcon slug={subclub.slug} size={24} />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block font-semibold text-slate-800">{subclub.name}</span>
                                  <span className="mt-0.5 block truncate text-sm text-slate-500">{subclub.description}</span>
                                </span>
                                <span className="hidden text-xs text-slate-500 sm:block">{count} membre{count === 1 ? '' : 's'}</span>
                                <ChevronRight size={19} className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700" aria-hidden="true" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <article>
                        <button
                          type="button"
                          onClick={() => transitionExplorer(() => setSelectedSubclubSlug(null))}
                          className="mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-blue-800 hover:text-blue-950"
                        >
                          <ArrowLeft size={16} aria-hidden="true" /> Retour aux sous-clubs
                        </button>
                        <div className="flex items-start gap-4">
                          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
                            <SubclubIcon slug={selectedSubclub.slug} size={34} />
                          </span>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{selectedClub.name}</p>
                            <h2 className="mt-1 text-3xl font-black text-slate-900">{selectedSubclub.name}</h2>
                            <p className="mt-2 max-w-2xl leading-6 text-slate-600">{selectedSubclub.description}</p>
                          </div>
                        </div>

                        {selectedSubclubApplication && (
                          <p className={`mt-5 inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${statusClasses[selectedSubclubApplication.status]}`}>
                            Votre candidature : {statusLabels[selectedSubclubApplication.status]}
                          </p>
                        )}

                        {data?.mode === 'student' && !activeApplication && (
                          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                            <label className="block text-sm font-semibold text-slate-800">
                              Motivation <span className="font-normal text-slate-500">(facultatif)</span>
                              <textarea
                                value={motivation}
                                onChange={(event) => setMotivation(event.target.value)}
                                maxLength={1000}
                                rows={3}
                                placeholder={`Pourquoi souhaitez-vous rejoindre le sous-club ${selectedSubclub.name} ?`}
                                className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => void submitApplication(selectedClub.slug, selectedSubclub.slug)}
                              disabled={Boolean(saving)}
                              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {saving === selectedSubclub.slug ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                              Candidater à ce sous-club
                            </button>
                          </div>
                        )}

                        <section className="mt-8" aria-labelledby="subclub-members-heading">
                          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Communauté</p>
                              <h3 id="subclub-members-heading" className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-900">
                                <Users size={20} className="text-blue-700" aria-hidden="true" />
                                Membres
                              </h3>
                            </div>
                            <span className="text-sm text-slate-500">{selectedSubclubMembers.length} membre{selectedSubclubMembers.length === 1 ? '' : 's'}</span>
                          </div>
                          {membersLoading ? (
                            <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><LoaderCircle size={17} className="animate-spin" /> Chargement des membres…</div>
                          ) : selectedSubclubMembers.length > 0 ? (
                            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                              {selectedSubclubMembers.map((member, index) => (
                                <li key={`${member.clubSlug}-${member.subclubSlug}-${member.name}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800">
                                    <UserRound size={19} aria-hidden="true" />
                                  </span>
                                  <span className="font-semibold text-slate-800">{member.name}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
                              Aucun membre n’a encore rejoint ce sous-club.
                            </p>
                          )}
                        </section>
                      </article>
                    )}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
