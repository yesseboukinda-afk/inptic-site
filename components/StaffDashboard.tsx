'use client';

import { CalendarDays, ChevronRight, FileCheck2, FileText, Folder, Image as ImageIcon, LogOut, Plus, Upload, Users, ClipboardList, CheckCircle2, X, Eye, Bell, Award, FolderOpen, ArrowLeft, RefreshCw } from 'lucide-react';
import { ChangeEvent, useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { canAccessStaffService, getRolePath, isSuperAdminRole } from '@/lib/roles';
import { useTranslation } from 'react-i18next';
import { translateNotification } from '@/lib/authMessages';
import { authClient } from '@/lib/auth-client';
import type { CandidatureValues } from '@/app/scolarite/formulaire/Formulairecandidature';

type Role = 'scolarite' | 'direction_etudes';

type Notification = {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  createdAt: string;
};

type Student = {
  email: string;
  name?: string;
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
  filieres?: string[];
  candidatureData?: Partial<CandidatureValues>;
  dossierNumero?: string;
  departement?: string;
  role?: string;
  dossierValide?: boolean;
  status?: 'inscription' | 'en_attente' | 'valide' | 'refuse';
  isArchived?: boolean;
  documents?: Array<{
    name: string;
    type: string;
    category?: string;
    data?: string;
    url?: string;
    path?: string;
  }>;
  admissionWorkflow?: {
    preRegistration?: { concoursSlug?: string | null; completedAt?: string };
  };
  emploiDuTemps?: {
    title: string;
    data?: string;
    name: string;
    type: string;
  }[];
  notifications?: Notification[];
};

type Department = {
  id: string;
  name: string;
  chefEmail: string;
};

const departments = [
  'Management des TIC',
  'Réseaux et Systèmes Numériques',
  'Audiovisuel',
];

const dossierDepartments = [
  { id: 'reseaux', name: 'Réseaux et Systèmes Numériques' },
  { id: 'audiovisuel', name: 'Audiovisuel' },
  { id: 'management', name: 'Management des TIC' },
  { id: 'genie-informatique', name: 'Génie informatique' },
];

const candidatureFieldLabels: Partial<Record<keyof CandidatureValues, string>> = {
  filieresInitiale: 'Filières en formation initiale',
  filieresContinue: 'Filières en formation continue',
  nom: 'Nom',
  prenoms: 'Prénoms',
  dateNaissance: 'Date de naissance',
  lieuNaissance: 'Lieu de naissance',
  nationalite: 'Nationalité',
  nationaliteAutre: 'Autre nationalité',
  adressePostale: 'Adresse postale',
  quartier: 'Quartier',
  ville: 'Ville',
  pays: 'Pays',
  telephone1: 'Téléphone principal',
  telephone2: 'Téléphone secondaire',
  telephone3: 'Autre téléphone',
  email: 'Adresse e-mail',
  baccalaureat: 'Série du baccalauréat',
  anneeBac: 'Année du baccalauréat',
  niveauInformatique: 'Niveau en informatique',
  urgenceNom: 'Nom du contact d’urgence',
  urgenceProfession: 'Profession du contact d’urgence',
  urgenceAdresse: 'Adresse du contact d’urgence',
  urgenceVille: 'Ville du contact d’urgence',
  urgencePays: 'Pays du contact d’urgence',
  urgenceTelephone: 'Téléphone du contact d’urgence',
  urgenceFax: 'Fax du contact d’urgence',
  urgenceEmail: 'E-mail du contact d’urgence',
  financeur: 'Mode de financement',
  financeurPrecision: 'Précision sur le financement',
  financeurNom: 'Nom du financeur',
  financeurVille: 'Ville du financeur',
  financeurPays: 'Pays du financeur',
  financeurTelephone: 'Téléphone du financeur',
  financeurEmail: 'E-mail du financeur',
  formationContinueSiEchec: 'Formation continue en cas d’échec',
  pieces: 'Pièces déclarées dans le formulaire',
  faitA: 'Fait à',
  faitLe: 'Fait le',
  certifie: 'Déclaration certifiée',
};

const candidatureFieldGroups: Array<{ title: string; fields: Array<keyof CandidatureValues> }> = [
  { title: 'Identité et coordonnées', fields: ['nom', 'prenoms', 'dateNaissance', 'lieuNaissance', 'nationalite', 'nationaliteAutre', 'adressePostale', 'quartier', 'ville', 'pays', 'telephone1', 'telephone2', 'telephone3', 'email'] },
  { title: 'Candidature et études', fields: ['filieresInitiale', 'filieresContinue', 'baccalaureat', 'anneeBac', 'niveauInformatique'] },
  { title: 'Parcours scolaire antérieur', fields: [] },
  { title: 'Contact en cas d’urgence', fields: ['urgenceNom', 'urgenceProfession', 'urgenceAdresse', 'urgenceVille', 'urgencePays', 'urgenceTelephone', 'urgenceFax', 'urgenceEmail'] },
  { title: 'Financement', fields: ['financeur', 'financeurPrecision', 'financeurNom', 'financeurVille', 'financeurPays', 'financeurTelephone', 'financeurEmail', 'formationContinueSiEchec'] },
  { title: 'Déclaration', fields: ['pieces', 'faitA', 'faitLe', 'certifie'] },
];

function formatCandidatureValue(field: keyof CandidatureValues, value: unknown) {
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string' && item.trim()).join(' · ') || 'Non renseigné';
  if (typeof value === 'string') {
    const choices: Partial<Record<keyof CandidatureValues, Record<string, string>>> = {
      nationalite: { gabonaise: 'Gabonaise', autre: 'Autre' },
      niveauInformatique: { faible: 'Faible', moyen: 'Moyen', suffisant: 'Suffisant' },
      financeur: { parents: 'Parents', etat: 'État', organisme: 'Organisme', autre: 'Autre' },
      formationContinueSiEchec: { oui: 'Oui', non: 'Non' },
    };
    return choices[field]?.[value] || value.trim() || 'Non renseigné';
  }
  return 'Non renseigné';
}

const defaultDepartments: Department[] = departments.map((name) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name,
  chefEmail: '',
}));

const addNotification = (existing: Notification[] | undefined, message: string, type: Notification['type'] = 'info') => [
  {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    type,
    createdAt: new Date().toISOString(),
  },
  ...(Array.isArray(existing) ? existing : []),
];

function getStudentFilieres(student: Student) {
  const values = [
    ...(Array.isArray(student.filieres) ? student.filieres : []),
    ...(Array.isArray(student.candidatureData?.filieresInitiale) ? student.candidatureData.filieresInitiale : []),
    ...(Array.isArray(student.candidatureData?.filieresContinue) ? student.candidatureData.filieresContinue : []),
    ...(typeof student.filiere === 'string' ? student.filiere.split(',') : []),
  ];
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function getStudentDossierDepartments(student: Student) {
  const filieres = getStudentFilieres(student).map((filiere) =>
    filiere.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  );
  const departmentIds = new Set<string>();

  filieres.forEach((filiere) => {
    if (filiere.includes('reseau') || filiere.includes('telecom')) {
      departmentIds.add('reseaux');
    }
    if (filiere.includes('audiovisuel') || filiere.includes('multimedia')) {
      departmentIds.add('audiovisuel');
    }
    if (
      filiere.includes('management') ||
      filiere.includes('communication') ||
      filiere.includes('marketing') ||
      filiere.includes('commercialisation')
    ) {
      departmentIds.add('management');
    }
    if (
      filiere.includes('genie') ||
      filiere.includes('developpement des applications') ||
      filiere.includes('systeme d information') ||
      filiere.includes('bases de donnees') ||
      filiere.includes('webmastering')
    ) {
      departmentIds.add('genie-informatique');
    }
  });

  return Array.from(departmentIds);
}

export default function StaffDashboard({ role }: { role: Role }) {
  const router = useRouter();
  const { t } = useTranslation();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [department, setDepartment] = useState(departments[0]);
  const [availableDepartments, setAvailableDepartments] =
    useState<Department[]>(defaultDepartments);

  const [newDepartment, setNewDepartment] = useState('');
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [profilesError, setProfilesError] = useState('');
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'dossiers' | 'documents' | 'quota'>('dossiers');
  const [viewingDocument, setViewingDocument] = useState<{ name: string; url: string; type: string } | null>(null);
  const [quotaAlert, setQuotaAlert] = useState<string | null>(null);
  const [selectedFiliere, setSelectedFiliere] = useState('all');
  const [isUpdatingDossier, setIsUpdatingDossier] = useState(false);
  const [profilesRefreshKey, setProfilesRefreshKey] = useState(0);
  const [isCandidateFormOpen, setIsCandidateFormOpen] = useState(false);
  const lastAutoRefreshAt = useRef(0);

  useEffect(() => {
    const director = localStorage.getItem('inptic_directeur');
    const session = localStorage.getItem('inptic_staff');

    let sessionData: { role?: unknown; service?: unknown; department?: unknown } = {};
    let directorData: { role?: unknown } = {};
    try {
      sessionData = JSON.parse(session || '{}');
    } catch {
      sessionData = {};
    }
    try {
      directorData = JSON.parse(director || '{}');
    } catch {
      directorData = {};
    }

    const assignedService = sessionData.service ?? sessionData.department;
    const hasStaffAccess =
      isSuperAdminRole(directorData.role) ||
      canAccessStaffService(sessionData.role, 'candidate_profiles', assignedService);

    if (!hasStaffAccess) {
      router.replace(getRolePath(String(sessionData.role || ''), undefined, assignedService));
      return;
    }

    const storedDepartments = JSON.parse(
      localStorage.getItem('inptic_departments') || 'null'
    );

    if (Array.isArray(storedDepartments) && storedDepartments.length) {
      const normalizedDepartments: Department[] = storedDepartments.map(
        (value: Department | string) =>
          typeof value === 'string'
            ? {
                id: value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                name: value,
                chefEmail: '',
              }
            : value
      );

      setAvailableDepartments(normalizedDepartments);
      setDepartment(normalizedDepartments[0].name);
    }

  }, [router, role]);

  useEffect(() => {
    const controller = new AbortController();
    setProfilesLoading(true);
    setProfilesError('');

    void (async () => {
      const { data: sessionData, error: sessionError } = await authClient.auth.getSession();
      if (controller.signal.aborted) return;
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        throw new Error('Votre session a expiré. Reconnectez-vous pour consulter les dossiers candidats.');
      }

      const response = await fetch('/api/candidat/profile', {
        cache: 'no-store',
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Impossible de charger les dossiers candidats.');
      }
      if (!Array.isArray(data.profiles)) {
        throw new Error('Le serveur a renvoyé une liste de dossiers invalide.');
      }

      setStudents(data.profiles.map((profile: Student) => ({ ...profile, role: 'etudiant' })));
      setProfilesError('');
    })()
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')) return;
        setProfilesError(error instanceof Error ? error.message : 'Impossible de charger les dossiers candidats.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setProfilesLoading(false);
      });

    return () => controller.abort();
  }, [profilesRefreshKey, role]);

  useEffect(() => {
    if (role !== 'scolarite' || activeTab !== 'dossiers') return;

    const refreshWhenVisible = () => {
      const now = Date.now();
      if (
        document.visibilityState === 'visible' &&
        !profilesLoading &&
        now - lastAutoRefreshAt.current > 3000
      ) {
        lastAutoRefreshAt.current = now;
        setProfilesRefreshKey((current) => current + 1);
      }
    };

    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [activeTab, profilesLoading, role]);

  // Quota email notification check (every 100 registrations)
  useEffect(() => {
    const totalCount = students.length;
    const lastNotified = Number(localStorage.getItem('inptic_scolarite_last_quota') || '0');
    const currentMilestone = Math.floor(totalCount / 100) * 100;

    if (currentMilestone > 0 && currentMilestone > lastNotified) {
      localStorage.setItem('inptic_scolarite_last_quota', currentMilestone.toString());
      setQuotaAlert(`Quota atteint : ${currentMilestone} inscriptions enregistrées. Un e-mail de synthèse a été envoyé à scolarite@inptic.ga.`);
    }
  }, [students]);

  const stats = useMemo(() => {
    const total = students.length;
    const enAttente = students.filter((s) => s.status === 'en_attente' || !s.status || s.status === 'inscription').length;
    const valides = students.filter((s) => s.status === 'valide' || s.dossierValide).length;
    const refuses = students.filter((s) => s.status === 'refuse').length;
    return { total, enAttente, valides, refuses };
  }, [students]);

  const pendingDossiers = useMemo(() => {
    return students.filter((student) => {
      if (student.status === 'valide' || student.status === 'refuse' || student.isArchived) return false;
      return true;
    });
  }, [students]);

  const filteredDossiers = useMemo(
    () => selectedFiliere === 'all'
      ? pendingDossiers
      : pendingDossiers.filter((student) => getStudentDossierDepartments(student).includes(selectedFiliere)),
    [pendingDossiers, selectedFiliere],
  );

  const dossierDepartmentCounts = useMemo(
    () => dossierDepartments.map((department) => ({
      ...department,
      count: pendingDossiers.filter((student) => getStudentDossierDepartments(student).includes(department.id)).length,
    })),
    [pendingDossiers],
  );

  async function updateStudentStatus(studentEmail: string, decision: 'valide' | 'refuse') {
    const status: Student['status'] = decision === 'valide' ? 'valide' : 'refuse';
    const isArchived = decision === 'refuse' ? true : false;
    const studentProfile = students.find((entry) => entry.email === studentEmail);
    if (!studentProfile) {
      setMessage('Le dossier candidat est introuvable. Rechargez la liste avant de réessayer.');
      return;
    }

    const notification =
      decision === 'valide'
        ? 'Votre dossier a été validé par la Scolarité. Vous pouvez maintenant accéder à votre espace personnel.'
        : 'Votre dossier a été refusé et archivé par la Scolarité. Un e-mail de notification officielle vous a été transmis.';
    const updatedProfile: Student = {
      ...studentProfile,
      dossierValide: decision === 'valide',
      status,
      isArchived,
      role: 'etudiant',
      notifications: addNotification(studentProfile.notifications, notification, decision === 'valide' ? 'success' : 'danger'),
    };

    setIsUpdatingDossier(true);
    try {
      const response = await fetch('/api/candidat/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedProfile,
          email: studentEmail,
          role: 'etudiant',
          dossierValide: decision === 'valide',
          status,
          dossierStep: status,
          isArchived,
          notifications: updatedProfile.notifications || [],
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'La mise à jour du dossier a échoué.');
      }

      setStudents((current) => current.map((entry) => entry.email === studentEmail ? updatedProfile : entry));
      setSelectedStudent(null);
      setMessage(decision === 'valide' ? `Dossier de ${studentEmail} validé avec succès.` : `Dossier de ${studentEmail} refusé et archivé automatiquement.`);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'La mise à jour du dossier a échoué.');
    } finally {
      setIsUpdatingDossier(false);
    }
  }

  const uploadForStudent = async (event: React.FormEvent) => {
    event.preventDefault();

    const student = students.find(
      (entry) => entry.email === selectedEmail
    );

    if (!student || !file) {
      setMessage(t('pages.selectStudentFile'));
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      const document = {
        name: file.name,
        type: file.type || 'application/octet-stream',
        data: typeof reader.result === 'string' ? reader.result : '',
      };

      const response = await fetch('/api/candidat/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...student,
          name: student.name || t('pages.student'),
          documents: [...(student.documents || []), document],
          role: 'etudiant',
        }),
      });

      setMessage(
        response.ok
          ? t('pages.published', { name: student.name || student.email })
          : t('pages.publishFailed')
      );

      if (response.ok) {
        setFile(null);
      }
    };

    reader.readAsDataURL(file);
  };

  const createDepartment = (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedName = newDepartment.trim().replace(/\s+/g, ' ');

    if (!normalizedName) {
      setMessage(t('pages.notProvided'));
      return;
    }

    if (
      availableDepartments.some(
        (value) =>
          value.name.toLowerCase() === normalizedName.toLowerCase()
      )
    ) {
      setMessage(t('pages.noData'));
      return;
    }

    const nextDepartments = [
      ...availableDepartments,
      {
        id: `${Date.now()}-${normalizedName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')}`,
        name: normalizedName,
        chefEmail: '',
      },
    ];

    localStorage.setItem(
      'inptic_departments',
      JSON.stringify(nextDepartments)
    );

    setAvailableDepartments(nextDepartments);
    setDepartment(normalizedName);
    setNewDepartment('');

    setMessage(
      `Département « ${normalizedName} » créé avec succès.`
    );
  };

  const saveDepartment = (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedName = newDepartment.trim().replace(/\s+/g, ' ');

    if (!normalizedName || !editingDepartmentId) {
      return;
    }

    if (
      availableDepartments.some(
        (entry) =>
          entry.id !== editingDepartmentId &&
          entry.name.toLowerCase() === normalizedName.toLowerCase()
      )
    ) {
      setMessage(t('pages.noData'));
      return;
    }

    const nextDepartments = availableDepartments.map((entry) =>
      entry.id === editingDepartmentId
        ? {
            ...entry,
            name: normalizedName,
          }
        : entry
    );

    localStorage.setItem(
      'inptic_departments',
      JSON.stringify(nextDepartments)
    );

    setAvailableDepartments(nextDepartments);

    setDepartment(
      nextDepartments.find(
        (entry) => entry.id === editingDepartmentId
      )?.name || department
    );

    setEditingDepartmentId(null);
    setNewDepartment('');

    setMessage(`Département « ${normalizedName} » modifié.`);
  };

  const deleteDepartment = (id: string) => {
    const target = availableDepartments.find(
      (entry) => entry.id === id
    );

    if (
      !target ||
      !window.confirm(
        `Supprimer le département « ${target.name} » ?`
      )
    ) {
      return;
    }

    const nextDepartments = availableDepartments.filter(
      (entry) => entry.id !== id
    );

    localStorage.setItem(
      'inptic_departments',
      JSON.stringify(nextDepartments)
    );

    setAvailableDepartments(nextDepartments);

    if (department === target.name) {
      setDepartment(nextDepartments[0]?.name || '');
    }

    setMessage(`Département « ${target.name} » supprimé.`);
  };

  const assignChef = (id: string, email: string) => {
    const nextDepartments = availableDepartments.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            chefEmail: email,
          }
        : entry
    );

    localStorage.setItem(
      'inptic_departments',
      JSON.stringify(nextDepartments)
    );

    setAvailableDepartments(nextDepartments);

    setMessage(
      email
        ? 'Chef de département attribué.'
        : 'Attribution retirée.'
    );
  };

  const uploadSchedule = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      setMessage(t('pages.selectStudentFile'));
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      const schedule = {
        title: `Emploi du temps - ${department}`,
        name: file.name,
        type: file.type || 'application/pdf',
        data: typeof reader.result === 'string' ? reader.result : '',
      };

      const targets = students.filter(
        (student) =>
          student.departement === department ||
          student.filiere === department
      );

      await Promise.all(
        targets.map((student) =>
          fetch('/api/candidat/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...student,
              documents: student.documents || [],
              emploiDuTemps: [
                ...(student.emploiDuTemps || []),
                schedule,
              ],
              role: 'etudiant',
            }),
          })
        )
      );

      setMessage(
        `${schedule.title} publié pour ${targets.length} étudiant(s).`
      );

      setFile(null);
    };

    reader.readAsDataURL(file);
  };

  const logout = () => {
    localStorage.removeItem('inptic_staff');
    router.replace('/candidat');
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-slate-950 px-6 py-8 text-white md:px-10">
        <div className="mx-auto max-w-6xl">
          <div>
            <h1 className="text-3xl font-black">
              {role === 'scolarite'
                ? 'Direction de la Scolarité • INPTIC'
                : 'Direction des études pédagogiques'}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              {role === 'scolarite' ? 'Gestion des dossiers d’admission, validation et attributions' : 'Pilotage pédagogique'}
            </p>
          </div>
        </div>
      </header>

      {quotaAlert && (
        <div className="mx-auto max-w-6xl px-4 md:px-8 mt-6">
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

      <section className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        {message && (
          <p
            className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs font-semibold text-blue-800"
            role="status"
          >
            {message}
          </p>
        )}
        {profilesError && (
          <p className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800" role="alert">
            {profilesError} Vérifiez les droits PostgreSQL des tables `profiles` et `private_files`.
          </p>
        )}

        {role === 'scolarite' ? (
          <div>
            {/* Onglets Scolarité */}
            <div className="flex gap-2 border-b border-slate-200 pb-4 mb-6">
              <button
                onClick={() => setActiveTab('dossiers')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  activeTab === 'dossiers' ? 'bg-blue-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ClipboardList size={15} />
                <span>Dossiers d&apos;admission ({pendingDossiers.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  activeTab === 'documents' ? 'bg-blue-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileCheck2 size={15} />
                <span>Publier documents étudiants</span>
              </button>
              <button
                onClick={() => setActiveTab('quota')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  activeTab === 'quota' ? 'bg-[#D4AF37] text-slate-950 shadow' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bell size={15} />
                <span>Rapports Quota E-mail</span>
              </button>
            </div>

            {activeTab === 'dossiers' && (
              <div className="space-y-4">
                {selectedStudent ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          {dossierDepartments.find((department) => department.id === selectedFiliere)?.name} / Dossier candidat
                        </p>
                        <h2 className="text-lg font-black text-slate-900">
                          {selectedStudent.name || `${selectedStudent.candidatureData?.prenoms || ''} ${selectedStudent.candidatureData?.nom || ''}`.trim() || 'Candidat'}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudent(null);
                          setIsCandidateFormOpen(false);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <ArrowLeft size={16} />
                        Retour aux candidats
                      </button>
                    </div>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-100 text-2xl font-black text-blue-700">
                          <span aria-hidden="true">{(selectedStudent.name || selectedStudent.candidatureData?.nom || 'C').slice(0, 2).toUpperCase()}</span>
                          {selectedStudent.photo && (
                            <button
                              type="button"
                              onClick={() => setViewingDocument({
                                name: `Photo d’identité - ${selectedStudent.name || 'candidat'}`,
                                url: selectedStudent.photo || '',
                                type: 'image/jpeg',
                              })}
                              className="absolute inset-0 h-full w-full cursor-zoom-in"
                              aria-label="Ouvrir la photo d’identité"
                            >
                              <img
                                src={selectedStudent.photo}
                                alt={`Photo de ${selectedStudent.name || 'la candidate ou du candidat'}`}
                                className="h-full w-full object-cover"
                                onError={(event) => { event.currentTarget.style.display = 'none'; }}
                              />
                            </button>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xl font-black text-slate-900">
                            {selectedStudent.name || `${selectedStudent.candidatureData?.prenoms || ''} ${selectedStudent.candidatureData?.nom || ''}`.trim() || 'Candidat'}
                          </h3>
                          <p className="mt-1 break-all text-sm text-slate-500">{selectedStudent.email}</p>
                          <p className="mt-2 font-mono text-xs font-bold text-blue-700">N° de dossier : {selectedStudent.dossierNumero || 'Non attribué'}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {selectedStudent.photo ? 'Photo d’identité enregistrée' : 'Aucune photo d’identité enregistrée dans ce dossier'}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {getStudentFilieres(selectedStudent).map((choice) => (
                              <span key={choice} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                                {choice}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900">Fichiers du dossier</h3>
                          <p className="mt-1 text-xs text-slate-500">Chaque élément s’ouvre individuellement, comme dans un dossier sur un ordinateur.</p>
                        </div>
                        <span className="text-xs text-slate-500">{(selectedStudent.photo ? 1 : 0) + (selectedStudent.candidatureData ? 1 : 0) + (selectedStudent.documents?.length || 0)} élément(s)</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        <button
                          type="button"
                          disabled={!selectedStudent.photo}
                          onClick={() => selectedStudent.photo && setViewingDocument({
                            name: `Photo d’identité - ${selectedStudent.name || 'candidat'}`,
                            url: selectedStudent.photo,
                            type: 'image/jpeg',
                          })}
                          className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ImageIcon size={30} className="text-violet-600" />
                          <span className="line-clamp-2 text-xs font-semibold text-slate-800">Photo d’identité</span>
                          <span className="text-[11px] text-slate-500">{selectedStudent.photo ? 'photo' : 'absente'}</span>
                        </button>
                        {selectedStudent.candidatureData && (
                          <button
                            type="button"
                            onClick={() => setIsCandidateFormOpen(true)}
                            className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-blue-300 hover:bg-blue-50"
                          >
                            <FileText size={30} className="text-blue-700" />
                            <span className="line-clamp-2 text-xs font-semibold text-slate-800">Fiche de candidature</span>
                            <span className="text-[11px] text-slate-500">formulaire</span>
                          </button>
                        )}
                        {(selectedStudent.documents || []).map((doc, index) => {
                          const source = doc.url || doc.data || '';
                          const extension = doc.name.includes('.') ? doc.name.split('.').pop()?.toUpperCase() : 'FICHIER';
                          return (
                            <button
                              key={`${doc.name}-${index}`}
                              type="button"
                              disabled={!source}
                              onClick={() => source && setViewingDocument({ name: doc.name, url: source, type: doc.type })}
                              className="flex min-h-32 min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                              title={doc.name}
                            >
                              <FileCheck2 size={30} className="text-emerald-700" />
                              <span className="line-clamp-2 text-xs font-semibold text-slate-800">{doc.category || doc.name}</span>
                              <span className="max-w-full truncate text-[11px] text-slate-500">{extension}</span>
                            </button>
                          );
                        })}
                      </div>
                      {!selectedStudent.photo && !selectedStudent.candidatureData && !selectedStudent.documents?.length && (
                        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                          Aucun fichier ni formulaire n’est enregistré pour ce candidat.
                        </p>
                      )}
                    </section>

                    {isCandidateFormOpen && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 p-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-blue-900">
                          <FileText size={18} />
                          Fiche de candidature
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCandidateFormOpen(false)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100"
                        >
                          <ArrowLeft size={14} />
                          Retour aux fichiers
                        </button>
                      </div>
                      {candidatureFieldGroups.map((group, groupIndex) => (
                        <section
                          key={group.title}
                          id={groupIndex === 0 ? 'candidate-application-form' : undefined}
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                          <h3 className="mb-4 text-sm font-black text-slate-900">{group.title}</h3>
                          {group.fields.length > 0 ? (
                            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                              {group.fields.map((field) => (
                                <div key={field} className="min-w-0">
                                  <dt className="text-xs font-medium text-slate-500">{candidatureFieldLabels[field] || field}</dt>
                                  <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
                                    {formatCandidatureValue(field, selectedStudent.candidatureData?.[field])}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                              {(selectedStudent.candidatureData?.cursus || [])
                                .filter((row) => Object.values(row).some((value) => typeof value === 'string' && value.trim()))
                                .map((row, index) => (
                                  <div key={`${row.annee}-${index}`} className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Parcours {index + 1}</p>
                                    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                                      {([
                                        ['Année', row.annee],
                                        ['Établissement', row.etablissement],
                                        ['Ville', row.ville],
                                        ['Classe', row.classe],
                                        ['Diplôme', row.diplome],
                                      ] as const).map(([label, value]) => (
                                        <div key={label}>
                                          <dt className="text-xs text-slate-500">{label}</dt>
                                          <dd className="text-sm font-semibold text-slate-800">{value || 'Non renseigné'}</dd>
                                        </div>
                                      ))}
                                    </dl>
                                  </div>
                                ))}
                              {!selectedStudent.candidatureData?.cursus?.some((row) => Object.values(row).some((value) => typeof value === 'string' && value.trim())) && (
                                <p className="text-sm text-slate-500">Aucun parcours antérieur renseigné.</p>
                              )}
                            </div>
                          )}
                        </section>
                      ))}
                    </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">En attente d&apos;examen</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isUpdatingDossier}
                          onClick={() => updateStudentStatus(selectedStudent.email, 'valide')}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle2 size={15} />
                          Valider le dossier
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingDossier}
                          onClick={() => updateStudentStatus(selectedStudent.email, 'refuse')}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <X size={15} />
                          Refuser &amp; archiver
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-black text-slate-900">
                          {selectedFiliere === 'all'
                            ? 'Dossiers de candidature par filière'
                            : dossierDepartments.find((department) => department.id === selectedFiliere)?.name}
                        </h2>
                        <span className="text-xs text-slate-500">
                          {profilesLoading
                            ? 'Chargement des dossiers...'
                            : selectedFiliere === 'all'
                            ? `${pendingDossiers.length} dossier(s) à classer`
                            : `${filteredDossiers.length} dossier(s) candidat`}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setProfilesRefreshKey((current) => current + 1)}
                          disabled={profilesLoading}
                          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                        >
                          <RefreshCw size={16} className={profilesLoading ? 'animate-spin' : ''} />
                          Actualiser
                        </button>
                        {selectedFiliere !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setSelectedFiliere('all')}
                          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <ArrowLeft size={16} />
                          Retour aux filières
                        </button>
                        )}
                      </div>
                    </div>

                    {profilesError && (
                      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-semibold text-red-800">{profilesError} Les filières restent affichées ; actualisez pour recharger les dossiers.</p>
                        <button
                          type="button"
                          onClick={() => setProfilesRefreshKey((current) => current + 1)}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
                        >
                          <RefreshCw size={15} />
                          Réessayer
                        </button>
                      </div>
                    )}
                    {selectedFiliere === 'all' ? (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {dossierDepartmentCounts.map((department) => (
                          <button
                            key={department.id}
                            type="button"
                            onClick={() => setSelectedFiliere(department.id)}
                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-slate-50"
                          >
                            <span className="rounded-xl bg-slate-100 p-2 text-slate-700">
                              <FolderOpen size={20} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold text-slate-900">{department.name}</span>
                              <span className="text-xs text-slate-500">{department.count} dossier(s) en attente</span>
                            </span>
                            <ChevronRight size={18} className="text-slate-400" />
                          </button>
                        ))}
                      </div>
                    ) : profilesLoading && filteredDossiers.length === 0 ? (
                      <div role="status" className="rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center text-sm font-medium text-blue-800">
                        Chargement des dossiers de cette filière...
                      </div>
                    ) : filteredDossiers.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
                        Aucun dossier en attente pour cette filière.
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredDossiers.map((student) => {
                          const folderName = student.name || `${student.candidatureData?.prenoms || ''} ${student.candidatureData?.nom || ''}`.trim() || 'Candidat';
                          return (
                            <button
                              key={student.email}
                              type="button"
                              onClick={() => {
                                setSelectedStudent(student);
                                setIsCandidateFormOpen(false);
                              }}
                              className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                            >
                              <span className="rounded-xl bg-amber-50 p-3 text-amber-600 transition group-hover:bg-blue-50 group-hover:text-blue-700">
                                <Folder size={22} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold text-slate-900">{folderName}</span>
                                <span className="block truncate text-xs text-slate-500">{student.email}</span>
                                <span className="mt-1 block font-mono text-[11px] text-slate-400">{student.dossierNumero || 'Dossier candidat'}</span>
                              </span>
                              <ChevronRight size={18} className="shrink-0 text-slate-400 transition group-hover:text-blue-600" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <form
                onSubmit={uploadForStudent}
                className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <FileCheck2
                    size={22}
                    className="text-blue-700"
                    aria-hidden="true"
                  />

                  <h2 className="text-lg font-bold">
                    Publier un document officiel étudiant
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-600">
                  Attestation de réinscription, diplôme, relevé de notes, etc.
                </p>

                <label className="mt-5 block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">
                    {t('pages.student')}
                  </span>

                  <select
                    required
                    value={selectedEmail}
                    onChange={(event) =>
                      setSelectedEmail(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                  >
                    <option value="">
                      Sélectionner un étudiant
                    </option>

                    {students.map((student) => (
                      <option
                        key={student.email}
                        value={student.email}
                      >
                        {student.name || student.email}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-4 block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">
                    {t('pages.document')}
                  </span>

                  <input
                    required
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(
                      event: ChangeEvent<HTMLInputElement>
                    ) =>
                      setFile(
                        event.target.files?.[0] || null
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </label>

                <button
                  type="submit"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                >
                  <Upload size={15} aria-hidden="true" />
                  Publier dans Documents
                </button>
              </form>
            )}

            {activeTab === 'quota' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-3xl">
                <h2 className="text-lg font-black text-slate-900">Rapports de Quota d&apos;Inscription par E-mail</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Système de notification automatisé : un e-mail de synthèse est transmis à la Scolarité (`scolarite@inptic.ga`) à chaque palier de 100 inscriptions atteint.
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
                              <p className="text-sm font-bold text-slate-900">Palier de {milestone} inscriptions atteint</p>
                              <p className="text-xs text-slate-500">Destinataire : scolarite@inptic.ga • Statut : E-mail de quota envoyé avec succès</p>
                            </div>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                            E-mail envoyé
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-sm text-slate-500">
                      <p className="font-semibold text-slate-700">Aucun palier de 100 inscriptions atteint pour le moment.</p>
                      <p className="mt-1 text-xs text-slate-500">Inscriptions actuelles : {stats.total} / 100. Le premier e-mail de quota sera envoyé au palier 100.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              role === 'direction_etudes'
                ? 'lg:grid-cols-1'
                : 'lg:grid-cols-[280px_1fr]'
            }`}
          >
            ...
          </div>
        )}
      </section>

      {/* ── MODAL DIALOGUE DE PRÉVISUALISATION DES PIÈCES JOINTES ── */}
      {viewingDocument && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative flex flex-col h-[88vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileCheck2 size={18} className="text-blue-600" />
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
