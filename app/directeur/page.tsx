'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle2, ClipboardList, Eye, FileText, LogOut, ShieldCheck, Users, X, Award, Check, AlertCircle } from 'lucide-react';
import { isDirectorRole, normalizeRole } from '@/lib/roles';
import { useTranslation } from 'react-i18next';
import { translateNotification } from '@/lib/authMessages';

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

export default function DirecteurDashboard() {
  const { t } = useTranslation();
  const router = useRouter();

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'etudiants' | 'dossiers' | 'notifications'>('dossiers');
  const [ready, setReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingDocument, setViewingDocument] = useState<{ name: string; url: string; type: string } | null>(null);
  const [quotaAlert, setQuotaAlert] = useState<string | null>(null);

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
      .then((response) => (response.ok ? response.json() : { profiles: [] }))
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
      })
      .catch(() => {
        setStudents(localProfiles);
      });
    setReady(true);
  }, [router]);

  // Quota email notification check (every 100 registrations)
  useEffect(() => {
    const totalCount = students.length;
    const lastNotified = Number(localStorage.getItem('inptic_last_notified_quota') || '0');
    const currentMilestone = Math.floor(totalCount / 100) * 100;

    if (currentMilestone > 0 && currentMilestone > lastNotified) {
      localStorage.setItem('inptic_last_notified_quota', currentMilestone.toString());
      setQuotaAlert(`Quota atteint : ${currentMilestone} inscriptions enregistrées. Un email récapitulatif officiel a été transmis à la Direction Générale.`);
    }
  }, [students]);

  const stats = useMemo(() => {
    const total = students.length;
    const enAttente = students.filter((s) => s.status === 'en_attente' || !s.status || s.status === 'inscription').length;
    const valides = students.filter((s) => s.status === 'valide' || s.dossierValide).length;
    const refuses = students.filter((s) => s.status === 'refuse').length;
    return { total, enAttente, valides, refuses };
  }, [students]);

  const filteredStudents = useMemo(() => {
    let list = students;
    if (activeTab === 'dossiers') {
      // Exclure les dossiers validés, refusés ou archivés de la file d'attente active
      list = list.filter((s) => s.status !== 'valide' && s.status !== 'refuse' && !(s as any).isArchived);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          s.email.toLowerCase().includes(q) ||
          (s.dossierNumero && s.dossierNumero.toLowerCase().includes(q)) ||
          (s.filiere && s.filiere.toLowerCase().includes(q))
      );
    }
    return list;
  }, [students, activeTab, searchQuery]);

  async function updateStudentStatus(studentEmail: string, decision: 'valide' | 'refuse') {
    const status: StudentProfile['status'] = decision === 'valide' ? 'valide' : 'refuse';
    const isArchived = decision === 'refuse' ? true : false;
    const stored = JSON.parse(localStorage.getItem('inptic_users') || '[]');
    const nextProfiles: StudentProfile[] = Array.isArray(stored)
      ? stored.map((entry: StudentProfile) => {
          if (entry.email !== studentEmail) return entry;

          const message =
            decision === 'valide'
              ? 'Votre dossier a été validé. Vous pouvez maintenant accéder à votre espace personnel.'
              : 'Votre dossier a été refusé et archivé par la Direction Générale. Un e-mail de notification officielle vous a été transmis.';

          return {
            ...entry,
            dossierValide: decision === 'valide',
            status,
            dossierStep: status,
            isArchived,
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
    setSelectedStudent(null);

    const studentProfile = nextProfiles.find((entry) => entry.email === studentEmail);
    if (!studentProfile) return;

    try {
      await fetch('/api/candidat/profile', {
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
    } catch (error) {
      console.error('Erreur persistence statut étudiant:', error);
    }

    window.dispatchEvent(new Event('auth-state-changed'));
  }

  function handleSelectStudent(student: StudentProfile) {
    setSelectedStudent(student);
  }

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Chargement du tableau de bord DG...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ── BANNIÈRE HÉRO DG ── */}
      <section className="relative overflow-hidden bg-slate-950 py-12 text-white md:py-16">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#D4AF37]/15 blur-3xl" />

        <div className="container-x relative z-10 px-4 md:px-0">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                <ShieldCheck size={14} className="text-[#D4AF37]" />
                Direction Générale • INPTIC Gabon
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Tableau de Bord &amp; Validation des Dossiers
              </h1>
              <p className="mt-2 text-sm text-slate-300 max-w-xl">
                Supervisez les candidatures, validez les dossiers d&apos;inscription et consultez les rapports de quota d&apos;inscription.
              </p>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
                <span className="text-2xl font-black text-white">{stats.total}</span>
                <p className="mt-1 text-xs font-medium text-slate-400">Total candidats</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
                <span className="text-2xl font-black text-amber-400">{stats.enAttente}</span>
                <p className="mt-1 text-xs font-medium text-amber-400">À valider</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
                <span className="text-2xl font-black text-emerald-400">{stats.valides}</span>
                <p className="mt-1 text-xs font-medium text-emerald-400">Validés</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alerte Quota */}
      {quotaAlert && (
        <div className="container-x mt-6 px-4 md:px-0">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-bold text-amber-900 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Award size={18} className="text-[#D4AF37] shrink-0" />
              <span>{quotaAlert}</span>
            </div>
            <button onClick={() => setQuotaAlert(null)} className="rounded-lg p-1 hover:bg-amber-100">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── BARRE DE NAVIGATION DES ONGLETS & RECHERCHE ── */}
      <section className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container-x px-4 md:px-0 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Onglets */}
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 w-full md:w-auto">
              <button
                onClick={() => setActiveTab('dossiers')}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'dossiers'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardList size={16} className="shrink-0" />
                <span className="truncate">Dossiers ({stats.enAttente})</span>
              </button>

              <button
                onClick={() => setActiveTab('etudiants')}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'etudiants'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users size={16} className="shrink-0" />
                <span className="truncate">Étudiants ({stats.total})</span>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-[#D4AF37] text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bell size={16} className="shrink-0" />
                <span className="truncate">Rapports Quota</span>
              </button>
            </div>

            {/* Recherche */}
            <div className="relative min-w-[240px]">
              <input
                type="text"
                placeholder="Rechercher nom, email, filière..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENU PRINCIPAL ── */}
      <section className="container-x mt-8 px-4 md:px-0">
        {activeTab === 'notifications' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Rapports de Quota d&apos;Inscription par E-mail</h2>
            <p className="text-xs text-slate-500 mt-1">
              Système de notification automatisé : un e-mail récapitulatif est transmis à la Direction Générale (`directeur@inptic.ga`) à chaque palier de 100 inscriptions atteintes.
            </p>
            <div className="mt-6 space-y-3">
              {stats.total >= 100 ? (
                Array.from({ length: Math.floor(stats.total / 100) }).map((_, idx) => {
                  const milestone = (idx + 1) * 100;
                  return (
                    <div key={milestone} className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-black text-xs">
                          {milestone}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Palier de {milestone} inscriptions validé et transmis</p>
                          <p className="text-xs text-slate-500">Destinataire : directeur@inptic.ga • Statut : E-mail de quota envoyé avec succès</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                        Transmis par E-mail
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-sm text-slate-500">
                  <p className="font-semibold text-slate-700">Aucun palier de 100 inscriptions atteint pour le moment.</p>
                  <p className="mt-1 text-xs text-slate-500">Inscriptions actuelles : {stats.total} / 100. Le premier e-mail de quota sera envoyé dès que le palier 100 sera atteint.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <ClipboardList size={32} className="mx-auto text-slate-400" />
                <h3 className="mt-3 text-base font-bold text-slate-900">Aucun dossier trouvé</h3>
                <p className="mt-1 text-sm text-slate-500">Aucun candidat ne correspond à vos critères actuels.</p>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const isValide = student.status === 'valide' || student.dossierValide;
                const isRefuse = student.status === 'refuse';

                return (
                  <div key={student.email} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{student.dossierNumero || 'N/A'}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${isValide ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : isRefuse ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {isValide ? 'Validé' : isRefuse ? 'Refusé' : 'En attente'}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <img
                          src={student.photo || 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#dbeafe"/><circle cx="100" cy="72" r="34" fill="#1d4ed8"/><path d="M52 158c12-28 35-42 48-42s36 14 48 42" fill="#1d4ed8"/></svg>')}
                          alt={student.name || 'Étudiant'}
                          className="h-12 w-12 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="truncate font-black text-slate-900">{student.name || 'Candidat'}</h3>
                          <p className="truncate text-xs text-slate-500">{student.email}</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Filière :</span>
                          <span className="font-semibold text-slate-800">{student.filiere || 'Non renseigné'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Niveau :</span>
                          <span className="font-semibold text-slate-800">{student.niveau || 'Non renseigné'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Téléphone :</span>
                          <span className="font-semibold text-slate-800">{student.phone || 'Non renseigné'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleSelectStudent(student)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-blue-600 transition"
                      >
                        <Eye size={14} />
                        <span>Examiner le dossier</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* ── MODAL EXAMEN DE DOSSIER ÉTUDIANT ── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 sm:p-6 backdrop-blur-sm">
          <div className="relative my-4 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 sm:p-8 shadow-2xl">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4">
              <img
                src={selectedStudent.photo || 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#dbeafe"/><circle cx="100" cy="72" r="34" fill="#1d4ed8"/><path d="M52 158c12-28 35-42 48-42s36 14 48 42" fill="#1d4ed8"/></svg>')}
                alt={selectedStudent.name}
                className="h-16 w-16 rounded-full object-cover shrink-0"
              />
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedStudent.name || 'Candidat'}</h3>
                <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                <span className="mt-1 inline-block font-mono text-xs font-bold text-blue-600">{selectedStudent.dossierNumero || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs sm:grid-cols-2">
              <div>
                <span className="text-slate-400">Filière demandée</span>
                <p className="font-semibold text-slate-800">{selectedStudent.filiere || 'Non renseigné'}</p>
              </div>
              <div>
                <span className="text-slate-400">Niveau d&apos;études</span>
                <p className="font-semibold text-slate-800">{selectedStudent.niveau || 'Non renseigné'}</p>
              </div>
              <div>
                <span className="text-slate-400">Promotion / Année</span>
                <p className="font-semibold text-slate-800">{selectedStudent.promotion || selectedStudent.annee || 'Non renseigné'}</p>
              </div>
              <div>
                <span className="text-slate-400">Téléphone</span>
                <p className="font-semibold text-slate-800">{selectedStudent.phone || 'Non renseigné'}</p>
              </div>
            </div>

            {selectedStudent.parcours && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider">Parcours académique</span>
                <p className="mt-1.5 text-slate-600 leading-relaxed">{selectedStudent.parcours}</p>
              </div>
            )}

            {selectedStudent.diplome && (
              <div className="mt-3 rounded-xl bg-slate-50 p-4 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider">Diplôme obtenu</span>
                <p className="mt-1.5 text-slate-600 leading-relaxed">{selectedStudent.diplome}</p>
              </div>
            )}

            {/* Documents justificatifs */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Documents justificatifs</h4>
              {selectedStudent.documents?.length ? (
                <div className="mt-2 space-y-2">
                  {selectedStudent.documents.map((doc, i) => {
                    const source = doc.url || doc.data || (doc.path && process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dossier_documents/${doc.path}` : '');
                    return (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-700">
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={16} className="text-blue-600 shrink-0" />
                          <span className="truncate">{doc.name}</span>
                        </div>
                        {source ? (
                          <button
                            type="button"
                            onClick={() => setViewingDocument({ name: doc.name, url: source, type: doc.type })}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                          >
                            <Eye size={13} />
                            Voir
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Non disponible</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-xs italic text-slate-400">Aucun document justificatif joint.</p>
              )}
            </div>

            {/* Actions de validation */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${selectedStudent.status === 'valide' ? 'bg-emerald-100 text-emerald-800' : selectedStudent.status === 'refuse' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                  Statut : {selectedStudent.status === 'valide' ? 'Validé' : selectedStudent.status === 'refuse' ? 'Refusé' : 'En attente'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedStudent.status !== 'valide' && (
                  <button
                    onClick={async () => {
                      await updateStudentStatus(selectedStudent.email, 'valide');
                      setSelectedStudent(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
                  >
                    <CheckCircle2 size={15} />
                    Valider le dossier
                  </button>
                )}

                {selectedStudent.status !== 'refuse' && (
                  <button
                    onClick={async () => {
                      await updateStudentStatus(selectedStudent.email, 'refuse');
                      setSelectedStudent(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-red-700 transition"
                  >
                    <X size={15} />
                    Refuser
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DIALOGUE DE PRÉVISUALISATION DES PIÈCES JOINTES ── */}
      {viewingDocument && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative flex flex-col h-[88vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 truncate">{viewingDocument.name}</h3>
              </div>
              <button
                onClick={() => setViewingDocument(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-4 overflow-hidden flex items-center justify-center">
              {viewingDocument.type?.includes('image') || /\.(png|jpg|jpeg|webp)$/i.test(viewingDocument.url) ? (
                <img src={viewingDocument.url} alt={viewingDocument.name} className="max-h-full max-w-full object-contain rounded-xl shadow" />
              ) : (
                <iframe src={viewingDocument.url} title={viewingDocument.name} className="h-full w-full rounded-xl border border-slate-200 bg-white shadow" />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
