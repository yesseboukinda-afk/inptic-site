'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronLeft, ChevronRight, ClipboardList, FileText, Users } from 'lucide-react';
import DirectorPanel, { DirectorSection } from '@/components/DirectorPanel';
import { isDirectorRole, normalizeRole } from '@/lib/roles';

type Notification = {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  createdAt: string;
};

type StudentProfile = {
  email: string;
  name: string;
  phone?: string;
  niveau?: string;
  parcours?: string;
  promotion?: string;
  etablissement?: string;
  annee?: string;
  specialite?: string;
  bio?: string;
  diplome?: string;
  photo?: string;
  filiere?: string;
  dossierNumero?: string;
  documents?: Array<{ name: string; type: string; data?: string; url?: string; path?: string }>;
  role?: string;
  dossierValide?: boolean;
  status?: 'inscription' | 'en_attente' | 'valide' | 'refuse';
  dossierStep?: 'inscription' | 'en_attente' | 'valide' | 'refuse';
  notifications?: Notification[];
};

const addNotification = (existing: Notification[] | undefined, message: string, type: Notification['type'] = 'info') => [
  {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    type,
    createdAt: new Date().toISOString(),
  },
  ...(Array.isArray(existing) ? existing : []),
];

export default function Directeur() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selected, setSelected] = useState<StudentProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<DirectorSection | null>(null);

  useEffect(() => {
    const director = localStorage.getItem('inptic_directeur');
    let directorData: { role?: unknown } = {};
    try {
      directorData = JSON.parse(director || '{}');
    } catch {
      directorData = {};
    }

    if (!director || !isDirectorRole(normalizeRole(directorData.role))) {
      router.replace('/candidat');
      return;
    }

    const stored = JSON.parse(localStorage.getItem('inptic_users') || '[]');
    const localProfiles: StudentProfile[] = Array.isArray(stored)
      ? stored
          .filter((entry: StudentProfile) => entry.role === 'etudiant' || entry.email)
          .map((entry: StudentProfile) => {
            try {
              const cachedDocuments = JSON.parse(localStorage.getItem(`inptic_documents_${entry.email.toLowerCase()}`) || 'null');
              return Array.isArray(cachedDocuments) && cachedDocuments.length
                ? { ...entry, documents: cachedDocuments }
                : entry;
            } catch {
              return entry;
            }
          })
      : [];

    fetch('/api/candidat/profile')
      .then((response) => response.ok ? response.json() : { profiles: [] })
      .then((data: { profiles?: StudentProfile[] }) => {
        const remoteProfiles = Array.isArray(data.profiles) ? data.profiles : [];
        const profilesByEmail = new Map(localProfiles.map((profile) => [profile.email.toLowerCase(), profile]));
        remoteProfiles.forEach((profile) => {
          const localProfile = profilesByEmail.get(profile.email.toLowerCase());
          profilesByEmail.set(profile.email.toLowerCase(), {
            ...localProfile,
            ...profile,
            documents: profile.documents?.length ? profile.documents : localProfile?.documents,
            role: 'etudiant',
          });
        });
        const profiles = Array.from(profilesByEmail.values());
        setStudents(profiles);
        setSelected(profiles[0] || null);
      })
      .catch(() => {
        setStudents(localProfiles);
        setSelected(localProfiles[0] || null);
      });
    setReady(true);
  }, [router]);

  function notifyStudent(studentEmail: string, message: string, type: Notification['type'] = 'info') {
    const stored = JSON.parse(localStorage.getItem('inptic_users') || '[]');
    const nextProfiles: StudentProfile[] = Array.isArray(stored)
      ? stored.map((entry: StudentProfile) => {
          if (entry.email !== studentEmail) return entry;
          return {
            ...entry,
            notifications: addNotification(entry.notifications, message, type),
          };
        })
      : [];

    localStorage.setItem('inptic_users', JSON.stringify(nextProfiles));

    const userProfileRaw = localStorage.getItem('inptic_user');
    if (userProfileRaw) {
      try {
        const userProfile = JSON.parse(userProfileRaw) as StudentProfile;
        if (userProfile.email === studentEmail) {
          localStorage.setItem(
            'inptic_user',
            JSON.stringify({
              ...userProfile,
              notifications: addNotification(userProfile.notifications, message, type),
            })
          );
        }
      } catch {
        // ignore invalid local profile data
      }
    }
  }

  async function updateStudentStatus(studentEmail: string, decision: 'valide' | 'refuse') {
    const status: StudentProfile['status'] = decision === 'valide' ? 'valide' : 'refuse';
    const stored = JSON.parse(localStorage.getItem('inptic_users') || '[]');
    const nextProfiles: StudentProfile[] = Array.isArray(stored)
      ? stored.map((entry: StudentProfile) => {
          if (entry.email !== studentEmail) return entry;

          const message =
            decision === 'valide'
              ? 'Votre dossier a été validé. Vous pouvez maintenant accéder à votre espace personnel.'
              : 'Votre dossier a été refusé. Vérifiez les informations et les justificatifs avant de réessayer.';

          return {
            ...entry,
            dossierValide: decision === 'valide',
            status,
            dossierStep: status,
            role: 'etudiant',
            notifications: addNotification(entry.notifications, message, decision === 'valide' ? 'success' : 'danger'),
          };
        })
      : [];

    localStorage.setItem('inptic_users', JSON.stringify(nextProfiles));
    const updatedStudents: StudentProfile[] = nextProfiles.filter(
      (entry) => entry.role === 'etudiant' || Boolean(entry.email)
    );
    setStudents(updatedStudents);

    const currentCandidate = localStorage.getItem('inptic_user');
    let updatedCandidate: StudentProfile | null = null;
    if (currentCandidate) {
      try {
        const parsed = JSON.parse(currentCandidate) as StudentProfile;
        if (parsed.email === studentEmail) {
          updatedCandidate = {
            ...parsed,
            dossierValide: decision === 'valide',
            status,
            dossierStep: status,
            role: 'etudiant',
            notifications: addNotification(parsed.notifications, decision === 'valide' ? 'Votre dossier a été validé. Vous pouvez maintenant accéder à votre espace personnel.' : 'Votre dossier a été refusé. Vérifiez les informations et les justificatifs avant de réessayer.', decision === 'valide' ? 'success' : 'danger'),
          };
          localStorage.setItem('inptic_user', JSON.stringify(updatedCandidate));
        }
      } catch {
        // ignore invalid local profile
      }
    }

    const selectedProfile =
      nextProfiles.find((entry) => entry.email === studentEmail) ||
      (updatedCandidate && updatedCandidate.email === studentEmail ? updatedCandidate : selected);

    if (selectedProfile && selected?.email === studentEmail) {
      setSelected({
        ...selectedProfile,
        dossierValide: decision === 'valide',
        status,
        dossierStep: status,
        role: 'etudiant',
        notifications: addNotification(selectedProfile.notifications, decision === 'valide' ? 'Votre dossier a été validé. Vous pouvez maintenant accéder à votre espace personnel.' : 'Votre dossier a été refusé. Vérifiez les informations et les justificatifs avant de réessayer.', decision === 'valide' ? 'success' : 'danger'),
      });
    }

    const studentProfile = selectedProfile ?? updatedCandidate ?? nextProfiles.find((entry) => entry.email === studentEmail);
    if (!studentProfile) return;

    try {
      const response = await fetch('/api/candidat/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...studentProfile,
          email: studentEmail,
          role: 'etudiant',
          dossierValide: decision === 'valide',
          status,
          dossierStep: status,
          notifications: studentProfile.notifications || [],
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error('Failed to persist student validation', data?.error || response.statusText);
      }
    } catch (error) {
      console.error('Failed to persist student validation', error);
    }

    window.dispatchEvent(new Event('auth-state-changed'));
  }

  function logout() {
    localStorage.removeItem('inptic_directeur');
    router.replace('/candidat');
  }

  const handleSelectStudent = (student: StudentProfile) => {
    setSelected(student);
    if (student.email) {
      notifyStudent(student.email, 'Votre dossier a été consulté par l’administration.', 'info');
    }
  };

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100">
        <p className="text-slate-600">Chargement des profils…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-600 p-6 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Accès directeur</p>
            <h1 className="mt-2 text-3xl font-black">Tableau de bord général</h1>
          </div>
        </header>

        <div className={`relative grid gap-6 ${sidebarCollapsed ? 'lg:grid-cols-[90px_1fr]' : 'lg:grid-cols-[210px_1fr]'}`}>
          <aside className={`border border-slate-700 bg-slate-900 p-3 shadow-sm ${sidebarCollapsed ? 'lg:h-[558px] lg:w-[90px]' : 'lg:w-[210px]'}`}>
            <button type="button" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} aria-label={sidebarCollapsed ? 'Développer le menu DG' : 'Réduire le menu DG'} className="mb-4 flex w-full items-center justify-center border border-slate-700 p-3 text-slate-200 hover:bg-slate-800">
              {sidebarCollapsed ? <ChevronRight size={24} aria-hidden="true" /> : <ChevronLeft size={24} aria-hidden="true" />}
            </button>
            <nav className="space-y-2" aria-label="Menu directeur">
              {[
                { label: 'Étudiants', section: 'etudiants' as DirectorSection, icon: Users },
                { label: 'Dossiers', section: 'dossiers' as DirectorSection, icon: ClipboardList },
                { label: 'Notifications', section: 'notifications' as DirectorSection, icon: Bell },
                { label: 'Profil DG', section: 'profil' as DirectorSection, icon: FileText },
              ].map(({ label, section, icon: Icon }) => (
                <button key={section} type="button" onClick={() => setActiveSection(section)} title={sidebarCollapsed ? label : undefined} className={`flex w-full items-center gap-3 border-l-2 border-transparent px-2 py-3 text-left text-sm font-semibold text-slate-200 hover:border-cyan-400 hover:bg-slate-800 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                  <Icon size={sidebarCollapsed ? 26 : 22} aria-hidden="true" />
                  {!sidebarCollapsed && <span>{label}</span>}
                </button>
              ))}
            </nav>
          </aside>

          {activeSection && <DirectorPanel key={activeSection} section={activeSection} students={students} selected={selected} sidebarCollapsed={sidebarCollapsed} onSelectStudent={handleSelectStudent} onUpdateStatus={(decision) => selected && updateStudentStatus(selected.email, decision)} onClose={() => setActiveSection(null)} />}

          <div className="hidden">
          <aside className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Étudiants</h2>
            <div className="mt-4 space-y-3">
              {students.length ? (
                students.map((student) => (
                  <button
                    key={student.email}
                    type="button"
                    onClick={() => handleSelectStudent(student)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      selected?.email === student.email
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={student.photo || 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                          <rect width="200" height="200" fill="#dbeafe"/>
                          <circle cx="100" cy="72" r="34" fill="#1d4ed8"/>
                          <path d="M52 158c12-28 35-42 48-42s36 14 48 42" fill="#1d4ed8"/>
                        </svg>
                      `)}
                      alt={student.name || 'Étudiant'}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{student.name || 'Étudiant'}</p>
                      <p className="truncate text-xs text-slate-500">{student.email}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-500">Aucun profil enregistré pour le moment.</p>
              )}
            </div>
          </aside>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            {selected ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={selected.photo || 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                          <rect width="200" height="200" fill="#dbeafe"/>
                          <circle cx="100" cy="72" r="34" fill="#1d4ed8"/>
                          <path d="M52 158c12-28 35-42 48-42s36 14 48 42" fill="#1d4ed8"/>
                        </svg>
                      `)}
                      alt={selected.name}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">{selected.name || 'Étudiant'}</h2>
                      <p className="text-sm text-slate-500">{selected.email}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                    Directeur général
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                    selected.status === 'valide'
                      ? 'bg-green-100 text-green-700'
                      : selected.status === 'refuse'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selected.status === 'valide'
                      ? 'Dossier validé'
                      : selected.status === 'refuse'
                        ? 'Dossier refusé'
                        : 'Dossier en attente'}
                  </span>

                  {selected.status !== 'valide' && selected.status !== 'refuse' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => updateStudentStatus(selected.email, 'valide')}
                        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                      >
                        Accepter
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStudentStatus(selected.email, 'refuse')}
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        Refuser
                      </button>
                    </>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Numéro de dossier</p>
                    <p className="mt-2 font-semibold text-slate-900">{selected.dossierNumero || 'Non attribué'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Filière</p>
                    <p className="mt-2 font-semibold text-slate-900">{selected.filiere || 'À renseigner'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Niveau</p>
                    <p className="mt-2 font-semibold text-slate-900">{selected.niveau || 'À renseigner'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Promotion</p>
                    <p className="mt-2 font-semibold text-slate-900">{selected.promotion || 'À renseigner'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Établissement</p>
                    <p className="mt-2 font-semibold text-slate-900">{selected.etablissement || 'À renseigner'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Spécialité</p>
                    <p className="mt-2 font-semibold text-slate-900">{selected.specialite || 'À renseigner'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Année</p>
                    <p className="mt-2 font-semibold text-slate-900">{selected.annee || 'À renseigner'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Téléphone</p>
                    <p className="mt-2 font-semibold text-slate-900">{selected.phone || 'À renseigner'}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Parcours académique</p>
                  <p className="mt-3 leading-7 text-slate-700">{selected.parcours || 'Aucun parcours renseigné.'}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Diplôme obtenu</p>
                  <p className="mt-3 leading-7 text-slate-700">{selected.diplome || 'Aucun diplôme renseigné.'}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Biographie</p>
                  <p className="mt-3 leading-7 text-slate-700">{selected.bio || 'Aucune biographie renseignée.'}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Documents</p>
                  {selected.documents?.length ? (
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {selected.documents.map((document) => (
                        <li key={`${document.name}-${document.type}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
                          <span className="truncate">{document.name}</span>
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">
                            {document.type.includes('pdf') ? 'PDF' : 'Fichier'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">Aucun document téléchargé.</p>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Notifications envoyées</p>
                  <div className="mt-3 space-y-2">
                    {(selected.notifications?.length ? selected.notifications : []).slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`rounded-xl border p-3 ${
                          notification.type === 'success'
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : notification.type === 'danger'
                              ? 'border-red-200 bg-red-50 text-red-800'
                              : notification.type === 'warning'
                                ? 'border-amber-200 bg-amber-50 text-amber-800'
                                : 'border-blue-200 bg-blue-50 text-blue-800'
                        }`}
                      >
                        <p className="text-sm">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid min-h-[400px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-500">
                Sélectionnez un étudiant pour voir son profil complet.
              </div>
            )}
          </section>
          </div>
        </div>
      </div>
    </main>
  );
}
