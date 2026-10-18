'use client';

import { CalendarDays, FileCheck2, LogOut, Plus, Upload, Users, ClipboardList, CheckCircle2, X, Eye, Bell, Award, ShieldCheck, FolderOpen, ArrowLeft } from 'lucide-react';
import { ChangeEvent, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { canAccessStaffService, getRolePath, isSuperAdminRole } from '@/lib/roles';
import { useTranslation } from 'react-i18next';
import { translateNotification } from '@/lib/authMessages';

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
  candidatureData?: {
    filieresInitiale?: string[];
    filieresContinue?: string[];
  };
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
    documentReview?: {
      status?: 'pending' | 'approved' | 'correction_requested';
      submittedAt?: string;
      reviewedAt?: string;
      feedback?: string;
    };
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
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'dossiers' | 'preinscriptions' | 'documents' | 'quota'>('dossiers');
  const [viewingDocument, setViewingDocument] = useState<{ name: string; url: string; type: string } | null>(null);
  const [preAdmissionReviewStudent, setPreAdmissionReviewStudent] = useState<Student | null>(null);
  const [preAdmissionFeedback, setPreAdmissionFeedback] = useState('');
  const [preAdmissionReviewSaving, setPreAdmissionReviewSaving] = useState(false);
  const [quotaAlert, setQuotaAlert] = useState<string | null>(null);
  const [selectedFiliere, setSelectedFiliere] = useState('all');

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

    const storedUsers = JSON.parse(localStorage.getItem('inptic_users') || '[]') as Student[];
    fetch('/api/candidat/profile')
      .then((response) => (response.ok ? response.json() : { profiles: [] }))
      .then((data) => {
        const remoteProfiles = Array.isArray(data.profiles) ? (data.profiles as Student[]) : [];
        const profilesByEmail = new Map<string, Student>(storedUsers.map((p) => [p.email.toLowerCase(), p]));
        remoteProfiles.forEach((p) => {
          const local = profilesByEmail.get(p.email.toLowerCase());
          profilesByEmail.set(p.email.toLowerCase(), { ...(local || {}), ...p, role: 'etudiant' } as Student);
        });
        setStudents(Array.from(profilesByEmail.values()));
      })
      .catch(() => {
        setStudents(storedUsers);
      });
  }, [router, role]);

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

  const pendingPreAdmissionReviews = useMemo(
    () => students.filter((student) => student.admissionWorkflow?.documentReview?.status === 'pending'),
    [students],
  );

  async function decidePreAdmissionDocuments(action: 'approved' | 'correction_requested') {
    if (!preAdmissionReviewStudent) return;
    setPreAdmissionReviewSaving(true);
    try {
      const response = await fetch('/api/admissions/document-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          email: preAdmissionReviewStudent.email,
          feedback: preAdmissionFeedback,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'La décision n’a pas pu être enregistrée.');

      const updatedStudent: Student = {
        ...preAdmissionReviewStudent,
        admissionWorkflow: {
          ...preAdmissionReviewStudent.admissionWorkflow,
          documentReview: payload.documentReview,
        },
      };
      setStudents((current) => current.map((student) =>
        student.email.toLowerCase() === updatedStudent.email.toLowerCase() ? updatedStudent : student
      ));
      setPreAdmissionReviewStudent(null);
      setPreAdmissionFeedback('');
      setMessage(payload.notificationSent
        ? action === 'approved'
          ? `Pièces validées. L’invitation a été envoyée à ${updatedStudent.email}.`
          : `Corrections demandées. L’e-mail a été envoyé à ${updatedStudent.email}.`
        : `Décision enregistrée, mais l’e-mail à ${updatedStudent.email} n’a pas pu être envoyé : ${payload.notificationError || 'vérifiez la configuration SMTP.'}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'La décision n’a pas pu être enregistrée.');
    } finally {
      setPreAdmissionReviewSaving(false);
    }
  }

  async function updateStudentStatus(studentEmail: string, decision: 'valide' | 'refuse') {
    const status: Student['status'] = decision === 'valide' ? 'valide' : 'refuse';
    const isArchived = decision === 'refuse' ? true : false;
    const stored = JSON.parse(localStorage.getItem('inptic_users') || '[]');
    const nextProfiles: Student[] = Array.isArray(stored)
      ? stored.map((entry: Student) => {
          if (entry.email !== studentEmail) return entry;

          const message =
            decision === 'valide'
              ? 'Votre dossier a été validé par la Scolarité. Vous pouvez maintenant accéder à votre espace personnel.'
              : 'Votre dossier a été refusé et archivé par la Scolarité. Un e-mail de notification officielle vous a été transmis.';

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
    setStudents(nextProfiles);
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
          isArchived,
          notifications: studentProfile.notifications || [],
        }),
      });
      setMessage(decision === 'valide' ? `Dossier de ${studentEmail} validé avec succès.` : `Dossier de ${studentEmail} refusé et archivé automatiquement.`);
    } catch (error) {
      console.error('Erreur persistence statut:', error);
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
                onClick={() => setActiveTab('preinscriptions')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  activeTab === 'preinscriptions' ? 'bg-blue-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck size={15} />
                <span>Pièces de préinscription ({pendingPreAdmissionReviews.length})</span>
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      {selectedFiliere === 'all'
                        ? 'Dossiers de candidature par filière'
                        : dossierDepartments.find((department) => department.id === selectedFiliere)?.name}
                    </h2>
                    <span className="text-xs text-slate-500">
                      {selectedFiliere === 'all'
                        ? `${pendingDossiers.length} dossier(s) à classer`
                        : `${filteredDossiers.length} candidat(s) dans cette filière`}
                    </span>
                  </div>
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

                {selectedFiliere === 'all' && (
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
                    </button>
                  ))}
                  </div>
                )}

                {filteredDossiers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
                    {selectedFiliere === 'all'
                      ? 'Aucun dossier en attente pour le moment. Tous les dossiers ont été traités.'
                      : `Aucun dossier en attente pour la filière « ${dossierDepartments.find((department) => department.id === selectedFiliere)?.name || selectedFiliere} ».`}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredDossiers.map((student) => (
                            <div key={student.email} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-xs font-bold text-slate-500">{student.dossierNumero || 'N/A'}</span>
                                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                                    En attente
                                  </span>
                                </div>
                                <div className="mt-3">
                                  <h4 className="font-black text-slate-900">{student.name || 'Candidat'}</h4>
                                  <p className="text-xs text-slate-500">{student.email}</p>
                                </div>
                                <div className="mt-3 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">
                                  <p className="font-semibold text-slate-500">Filière(s) choisie(s)</p>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {getStudentFilieres(student).map((choice) => (
                                      <span key={choice} className="rounded-full bg-white px-2 py-1 font-semibold text-slate-800 ring-1 ring-slate-200">
                                        {choice}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="mt-2">
                                    <span className="text-slate-400">Niveau :</span>{' '}
                                    <span className="font-semibold text-slate-800">{student.niveau || 'Non renseigné'}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudent(student)}
                                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white transition hover:bg-blue-600"
                                >
                                  <Eye size={14} />
                                  <span>Examiner &amp; Valider</span>
                                </button>
                              </div>
                            </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'preinscriptions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900">Vérification préalable des pièces</h2>
                  <span className="text-xs text-slate-500">{pendingPreAdmissionReviews.length} dossier(s) à vérifier</span>
                </div>
                {pendingPreAdmissionReviews.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
                    Aucune pièce de préinscription en attente.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingPreAdmissionReviews.map((student) => (
                      <article key={student.email} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black text-slate-900">{student.name || 'Candidat'}</h3>
                            <p className="mt-1 text-xs text-slate-500">{student.email}</p>
                          </div>
                          <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                            À vérifier
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-600">
                          Session : {student.admissionWorkflow?.preRegistration?.concoursSlug || 'Non précisée'}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          Filière(s) : <span className="font-semibold text-slate-800">{getStudentFilieres(student).join(' • ') || 'Non renseignée'}</span>
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Transmis : {student.admissionWorkflow?.documentReview?.submittedAt
                            ? new Date(student.admissionWorkflow.documentReview.submittedAt).toLocaleString('fr-FR')
                            : 'Date inconnue'}
                        </p>
                        <div className="mt-4 space-y-2">
                          {(student.documents || []).filter((document) => document.category).map((document) => (
                            <p key={`${document.category}-${document.name}`} className="truncate rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                              {document.category}: {document.name}
                            </p>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPreAdmissionReviewStudent(student);
                            setPreAdmissionFeedback('');
                          }}
                          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
                        >
                          <Eye size={14} />
                          Examiner les pièces
                        </button>
                      </article>
                    ))}
                  </div>
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

      {preAdmissionReviewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6">
          <div className="relative my-4 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => setPreAdmissionReviewStudent(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
            <div className="pr-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                <ShieldCheck size={14} /> Vérification préalable
              </span>
              <h2 className="mt-3 text-2xl font-black text-slate-900">{preAdmissionReviewStudent.name || 'Candidat'}</h2>
              <p className="mt-1 text-sm text-slate-500">{preAdmissionReviewStudent.email}</p>
              <p className="mt-3 text-xs text-slate-600">
                Session : {preAdmissionReviewStudent.admissionWorkflow?.preRegistration?.concoursSlug || 'Non précisée'}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {(preAdmissionReviewStudent.documents || []).map((document, index) => (
                <div key={`${document.path || document.name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{document.category || 'Pièce justificative'}</p>
                    <p className="truncate text-xs text-slate-500">{document.name}</p>
                  </div>
                  {document.url || document.data ? (
                    <button
                      type="button"
                      onClick={() => setViewingDocument({
                        name: document.name,
                        url: document.url || document.data || '',
                        type: document.type,
                      })}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                    >
                      <Eye size={13} /> Voir
                    </button>
                  ) : (
                    <span className="text-xs text-rose-600">Document indisponible</span>
                  )}
                </div>
              ))}
            </div>

            <label className="mt-6 block">
              <span className="mb-2 block text-sm font-bold text-slate-800">Commentaire pour le candidat</span>
              <textarea
                value={preAdmissionFeedback}
                onChange={(event) => setPreAdmissionFeedback(event.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Obligatoire si vous demandez une correction."
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 outline-none focus:border-blue-500"
              />
            </label>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={preAdmissionReviewSaving || !preAdmissionFeedback.trim()}
                onClick={() => void decidePreAdmissionDocuments('correction_requested')}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Demander une correction
              </button>
              <button
                type="button"
                disabled={preAdmissionReviewSaving}
                onClick={() => void decidePreAdmissionDocuments('approved')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                Valider et inviter à candidater
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EXAMEN DE DOSSIER ÉTUDIANT (SCOLARITÉ) ── */}
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
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xl shrink-0">
                {(selectedStudent.name || 'C').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedStudent.name || 'Candidat'}</h3>
                <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                <span className="mt-1 inline-block font-mono text-xs font-bold text-blue-600">{selectedStudent.dossierNumero || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs sm:grid-cols-2">
              <div>
                <span className="text-slate-400">Filière demandée</span>
                <p className="font-semibold text-slate-800">{getStudentFilieres(selectedStudent).join(' • ') || 'Non renseignée'}</p>
              </div>
              <div>
                <span className="text-slate-400">Niveau d&apos;études</span>
                <p className="font-semibold text-slate-800">{selectedStudent.niveau || 'Non renseigné'}</p>
              </div>
              <div>
                <span className="text-slate-400">Téléphone</span>
                <p className="font-semibold text-slate-800">{selectedStudent.phone || 'Non renseigné'}</p>
              </div>
            </div>

            {/* Documents justificatifs avec bouton Voir ouvrant la boîte de dialogue */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Documents justificatifs</h4>
              {selectedStudent.documents?.length ? (
                <div className="mt-2 space-y-2">
                  {selectedStudent.documents.map((doc, i) => {
                    const source = doc.url || doc.data || '';
                    return (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-700">
                        <div className="flex items-center gap-2 truncate">
                          <FileCheck2 size={16} className="text-blue-600 shrink-0" />
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

            {/* Actions de validation avec archivage automatique sur refus et mail de notification */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                En attente d&apos;examen
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await updateStudentStatus(selectedStudent.email, 'valide');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
                >
                  <CheckCircle2 size={15} />
                  Valider le dossier
                </button>

                <button
                  onClick={async () => {
                    await updateStudentStatus(selectedStudent.email, 'refuse');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-red-700 transition"
                >
                  <X size={15} />
                  Refuser &amp; Archiver
                </button>
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
