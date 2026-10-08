'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  Calendar,
  ChevronRight,
  Download,
  FileCheck,
  FileText,
  Filter,
  GraduationCap,
  Layers,
  Lock,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  UploadCloud,
  UserCheck,
  Users,
  X,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Archive,
  Edit,
  Trash2,
  Bell,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth-client';
import { canAccessStaffService, isStaffOrAdminUser } from '@/lib/roles';
import { ConcoursAttachment, ConcoursItem, ConcoursStatus } from '@/types/concours';
import DeleteButton from '@/components/DeleteButton';
import TranslatedText from '@/components/TranslatedText';
import { getCurrentAdmissionConcours } from '@/lib/admissionsWorkflow';

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function ConcoursPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [concours, setConcours] = useState<ConcoursItem[]>([]);
  const [candidate, setCandidate] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'concours' | 'resultats' | 'historique'>('concours');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Modal détails / résultat sélectionné
  const [selectedConcours, setSelectedConcours] = useState<ConcoursItem | null>(null);
  const [preRegistrationSaving, setPreRegistrationSaving] = useState(false);
  const [preRegistrationMessage, setPreRegistrationMessage] = useState('');
  const [preRegistrationError, setPreRegistrationError] = useState('');
  const [showPreRegistrations, setShowPreRegistrations] = useState(false);
  const [preRegistrations, setPreRegistrations] = useState<Array<{ id: string; full_name: string; email: string; phone: string; concours_slug: string; created_at: string }>>([]);
  const [preRegistrationsLoading, setPreRegistrationsLoading] = useState(false);

  // Authentification & Rôles
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userService, setUserService] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Administration Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ConcoursItem | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Formulaire concours admin
  const [formTitle, setFormTitle] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [formStatus, setFormStatus] = useState<ConcoursStatus>('en_cours');
  const [formDescription, setFormDescription] = useState('');
  const [formConditions, setFormConditions] = useState<string>('');
  const [formExamDate, setFormExamDate] = useState('');
  const [formRegStart, setFormRegStart] = useState('');
  const [formRegEnd, setFormRegEnd] = useState('');
  const [formResultsPublished, setFormResultsPublished] = useState(false);
  const [formResultsPdf, setFormResultsPdf] = useState('');
  const [formAdmittedText, setFormAdmittedText] = useState('');
  const [formWaitingText, setFormWaitingText] = useState('');
  const [formResultsNotes, setFormResultsNotes] = useState('');
  const [formResultsDate, setFormResultsDate] = useState('');
  const [formAttachments, setFormAttachments] = useState<ConcoursAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingPv, setIsUploadingPv] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pvInputRef = useRef<HTMLInputElement>(null);

  // Vérification de session
  useEffect(() => {
    authClient.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (session) {
        setToken(session.access_token);
        setUserEmail(session.user?.email || null);
        const role = session.user?.app_metadata?.role;
        setUserRole(typeof role === 'string' ? role : null);
        const service = session.user?.user_metadata?.service ?? session.user?.user_metadata?.department;
        setUserService(typeof service === 'string' ? service : null);
      }
    });

    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || null);
      setUserEmail(session?.user?.email || null);
      const role = session?.user?.app_metadata?.role;
      setUserRole(typeof role === 'string' ? role : null);
      const service = session?.user?.user_metadata?.service ?? session?.user?.user_metadata?.department;
      setUserService(typeof service === 'string' ? service : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const canManageConcours = canAccessStaffService(userRole, 'concours', userService);
  const canManagePreinscriptions = canAccessStaffService(userRole, 'preinscriptions', userService);
  const currentConcours = useMemo(() => getCurrentAdmissionConcours(concours), [concours]);

  useEffect(() => {
    const syncCandidate = () => {
      try {
        const stored = localStorage.getItem('inptic_user');
        const profile = stored ? JSON.parse(stored) as Record<string, any> : null;
        setCandidate(profile);
        if (profile?.email && !isStaffOrAdminUser(profile.email, null)) setUserEmail(profile.email);
      } catch {
        setCandidate(null);
      }
    };

    syncCandidate();
    window.addEventListener('auth-state-changed', syncCandidate);
    return () => window.removeEventListener('auth-state-changed', syncCandidate);
  }, []);

  const handlePreRegistration = async () => {
    if (!candidate?.email) {
      router.push('/candidat');
      return;
    }
    setPreRegistrationSaving(true);
    setPreRegistrationError('');
    setPreRegistrationMessage('');
    try {
      const { data, error } = await authClient.auth.getSession();
      if (error) throw error;
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        throw new Error('Votre compte a été créé, mais la session n’est pas encore active. Confirmez votre adresse e-mail, puis connectez-vous avant de vous préinscrire.');
      }
      const completedAt = new Date().toISOString();
      const response = await fetch('/api/concours/preinscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          concoursSlug: currentConcours?.slug ?? null,
          fullName: candidate.name || '',
          phone: candidate.phone || '',
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Préinscription impossible.');
      const updatedCandidate: Record<string, any> = {
        ...candidate,
        admissionWorkflow: {
          ...candidate.admissionWorkflow,
          preRegistration: {
            concoursSlug: currentConcours?.slug ?? null,
            concoursTitle: currentConcours?.title ?? null,
            completedAt,
            status: 'dossier_en_attente',
          },
        },
      };
      const profileResponse = await fetch('/api/candidat/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCandidate),
      });
      const profilePayload = await profileResponse.json().catch(() => ({}));
      if (!profileResponse.ok) {
        throw new Error(profilePayload.error || 'La préinscription a été reçue, mais son rattachement au compte a échoué. Réessayez.');
      }

      const profileToPersist: Record<string, any> = profilePayload.profile
        ? { ...updatedCandidate, documents: profilePayload.profile.documents || updatedCandidate.documents }
        : updatedCandidate;
      localStorage.setItem('inptic_user', JSON.stringify(profileToPersist));
      setCandidate(profileToPersist);
      const storedUsers = JSON.parse(localStorage.getItem('inptic_users') || '[]');
      const updatedUsers = storedUsers.map((profile: Record<string, unknown>) =>
        profile.email === profileToPersist.email ? { ...profile, ...profileToPersist } : profile
      );
      localStorage.setItem('inptic_users', JSON.stringify(updatedUsers));
      window.dispatchEvent(new Event('auth-state-changed'));
      setPreRegistrationMessage('Préinscription enregistrée. Votre dossier est en attente de complément.');
      router.push(`/admissions/depot${currentConcours ? `?concours=${encodeURIComponent(currentConcours.slug)}` : ''}`);
    } catch (error) {
      setPreRegistrationError(error instanceof Error ? error.message : 'Préinscription impossible.');
    } finally {
      setPreRegistrationSaving(false);
    }
  };

  const handleShowPreRegistrations = async () => {
    setShowPreRegistrations(true);
    setPreRegistrationsLoading(true);
    try {
      const response = await fetch('/api/concours/preinscriptions', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Chargement des préinscriptions impossible.');
      setPreRegistrations(Array.isArray(payload.data) ? payload.data : []);
    } catch (error) {
      setPreRegistrations([]);
      setPreRegistrationError(error instanceof Error ? error.message : 'Chargement impossible.');
    } finally {
      setPreRegistrationsLoading(false);
    }
  };

  const fetchConcours = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/concours');
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setConcours(json.data);
      }
    } catch (err) {
      console.error('Erreur chargement concours:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConcours();
    const refreshInterval = window.setInterval(() => void fetchConcours(), 30_000);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, []);

  // Années disponibles
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    concours.forEach((c) => set.add(c.sessionYear));
    return Array.from(set).sort((a, b) => b - a);
  }, [concours]);

  // Filtrage selon l'onglet (Correction des incohérences)
  const filteredItems = useMemo(() => {
    let list = concours;

    // Trier par sessionYear décroissant, puis createdAt décroissant
    const sorted = [...list].sort((a, b) => {
      if (b.sessionYear !== a.sessionYear) return b.sessionYear - a.sessionYear;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Filtre onglet
    if (activeTab === 'concours') {
      list = sorted.filter((c) => c.status === 'en_cours' || c.status === 'a_venir');
    } else if (activeTab === 'resultats') {
      const publishedResults = sorted.filter((c) => c.results?.published);
      list = publishedResults.length > 0 ? publishedResults : (sorted[0] ? [sorted[0]] : []);
    } else if (activeTab === 'historique') {
      list = sorted.filter((c) => c.status === 'termine' || (c.status as string) === 'archive' || c.sessionYear < new Date().getFullYear());
    }

    // Filtre année (sauf sur l'onglet résultats où l'on affiche le plus récent)
    if (activeTab !== 'resultats' && selectedYear !== 'all') {
      list = list.filter((c) => c.sessionYear === parseInt(selectedYear, 10));
    }

    // Recherche plein texte
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.results?.admittedList?.some((name) => name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [concours, activeTab, selectedYear, searchQuery]);

  // Statistiques
  const stats = useMemo(() => {
    const enCours = concours.filter((c) => c.status === 'en_cours').length;
    const aVenir = concours.filter((c) => c.status === 'a_venir').length;
    const termines = concours.filter((c) => c.status === 'termine' || c.sessionYear < new Date().getFullYear()).length;
    const resultatsPublies = concours.filter(
      (c) => c.results?.published && (Boolean(c.results?.pdfUrl) || (Array.isArray(c.results?.admittedList) && c.results.admittedList.length > 0))
    ).length;
    return { enCours, aVenir, termines, resultatsPublies, total: concours.length };
  }, [concours]);

  // Gestion Admin : Ouvrir formulaire création
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormDepartment('Informatique, Télécoms & Multimédia');
    setFormYear(new Date().getFullYear());
    setFormStatus('en_cours');
    setFormDescription('');
    setFormConditions(
      "Être titulaire d'un Baccalauréat scientifique ou technique."
    );
    setFormExamDate('');
    setFormRegStart('');
    setFormRegEnd('');
    setFormResultsPublished(false);
    setFormResultsPdf('');
    setFormAdmittedText('');
    setFormWaitingText('');
    setFormResultsNotes('');
    setFormResultsDate('');
    setFormAttachments([]);
    setUploadError('');
    setFormError('');
    setShowAdminModal(true);
  };

  // Gestion Admin : Ouvrir formulaire édition
  const handleOpenEdit = (item: ConcoursItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDepartment(item.department);
    setFormYear(item.sessionYear);
    setFormStatus(item.status);
    setFormDescription(item.description);
    setFormConditions(Array.isArray(item.conditions) ? item.conditions.join('\n') : '');
    setFormExamDate(item.calendar?.examDate ? item.calendar.examDate.slice(0, 10) : '');
    setFormRegStart(item.calendar?.registrationStart ? item.calendar.registrationStart.slice(0, 10) : '');
    setFormRegEnd(item.calendar?.registrationEnd ? item.calendar.registrationEnd.slice(0, 10) : '');
    setFormResultsPublished(Boolean(item.results?.published));
    setFormResultsPdf(item.results?.pdfUrl || '');
    setFormAdmittedText(Array.isArray(item.results?.admittedList) ? item.results.admittedList.join('\n') : '');
    setFormWaitingText(Array.isArray(item.results?.waitingList) ? item.results.waitingList.join('\n') : '');
    setFormResultsNotes(item.results?.notes || '');
    setFormResultsDate(item.calendar?.resultsDate ? item.calendar.resultsDate.slice(0, 10) : '');
    setFormAttachments(Array.isArray(item.attachments) ? item.attachments : []);
    setUploadError('');
    setFormError('');
    setShowAdminModal(true);
  };

  const uploadFiles = async (files: FileList | null, kind: 'docs' | 'pv') => {
    if (!files || files.length === 0 || !token) return;
    if (kind === 'pv') setIsUploadingPv(true);
    else setIsUploading(true);
    setUploadError('');

    try {
      const data = new FormData();
      Array.from(files).forEach((f) => data.append('files', f));
      const res = await fetch('/api/concours/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Erreur lors du téléversement.');
      const uploaded: ConcoursAttachment[] = json.data || [];
      if (kind === 'pv') {
        const first = uploaded[0];
        if (first) setFormResultsPdf(first.url);
      } else {
        setFormAttachments((prev) => [...prev, ...uploaded]);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur de téléversement.');
    } finally {
      setIsUploading(false);
      setIsUploadingPv(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (pvInputRef.current) pvInputRef.current.value = '';
    }
  };

  // Gestion Admin : Enregistrer (avec validation et dates sans décalage horaire)
  const handleSaveConcours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setFormError('Session expirée, veuillez vous reconnecter.');
      return;
    }

    if (!formTitle.trim()) {
      setFormError('Le titre officiel du concours est obligatoire.');
      return;
    }

    if (formRegStart && formRegEnd && new Date(formRegStart) > new Date(formRegEnd)) {
      setFormError('La date de clôture des inscriptions doit être postérieure à la date d’ouverture.');
      return;
    }

    setFormSaving(true);
    setFormError('');

    const payload = {
      id: editingItem?.id,
      title: formTitle.trim(),
      department: formDepartment.trim() || 'Général',
      sessionYear: formYear,
      status: formStatus,
      description: formDescription.trim(),
      conditions: formConditions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      attachments: formAttachments,
      calendar: {
        registrationStart: formRegStart ? `${formRegStart}T00:00:00.000Z` : null,
        registrationEnd: formRegEnd ? `${formRegEnd}T23:59:59.000Z` : null,
        examDate: formExamDate ? `${formExamDate}T08:00:00.000Z` : null,
        resultsDate: formResultsDate
          ? `${formResultsDate}T12:00:00.000Z`
          : formResultsPublished
            ? new Date().toISOString()
            : null,
      },
      results: {
        published: formResultsPublished,
        publishedAt: formResultsPublished ? (editingItem?.results?.publishedAt || new Date().toISOString()) : null,
        pdfUrl: formResultsPdf || null,
        notes: formResultsNotes || null,
        admittedList: formAdmittedText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        waitingList: formWaitingText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      },
    };

    try {
      const url = '/api/concours';
      const method = editingItem ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Erreur lors de la sauvegarde du concours');
      }

      setShowAdminModal(false);
      await fetchConcours();
    } catch (err: any) {
      setFormError(err.message || 'Erreur inattendue.');
    } finally {
      setFormSaving(false);
    }
  };

  // Suppression
  const handleDeleteConcours = async (id: string) => {
    if (!token) {
      alert('Session requise ou rôle insuffisant. Veuillez vous reconnecter en tant qu’administrateur.');
      return;
    }

    try {
      const res = await fetch(`/api/concours?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Erreur lors de la suppression du concours.');
      }
      await fetchConcours();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ── BANNIÈRE HÉRO DU PORTAIL CONCOURS ── */}
      <section className="relative isolate overflow-hidden text-white bg-slate-950">
        <img src="/banniere/6.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.88) 30%, rgba(15, 23, 42, 0.48) 50%, rgba(30, 136, 168, 0.16) 75%, rgba(30, 136, 168, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
          <h1 className="text-4xl font-black md:text-6xl">{t('concoursPage.title', 'Concours, Admissions & Résultats')}</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            {t('concoursPage.intro', 'Consultez les concours ouverts et à venir pour intégrer l’INPTIC Gabon, téléchargez les règlements officiels et accédez aux procès-verbaux des résultats.')}
          </p>

          {/* Statistiques rapides */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
              <span className="text-2xl font-black text-white">{stats.enCours}</span>
              <p className="mt-1 text-xs font-medium text-emerald-400">{t('concoursPage.inProgress', 'En cours')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
              <span className="text-2xl font-black text-white">{stats.aVenir}</span>
              <p className="mt-1 text-xs font-medium text-amber-400">{t('concoursPage.upcoming', 'À venir')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
              <span className="text-2xl font-black text-white">{stats.termines}</span>
              <p className="mt-1 text-xs font-medium text-slate-400">{t('concoursPage.archives', 'Archives')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
              <span className="text-2xl font-black text-[#D4AF37]">{stats.resultatsPublies}</span>
              <p className="mt-1 text-xs font-medium text-[#D4AF37]">{t('concoursPage.resultsAvailable', 'Résultats dispo')}</p>
            </div>
          </div>

          {/* Raccourcis Admissions */}
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-300">
              Admissions &amp; Concours
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {[
                { id: 'guide', label: t('concoursPage.guide', "Guide d'admission"),         href: '/admissions/guide',       icon: FileText },
                { id: 'concours-results', label: t('concoursPage.concoursAndResults', 'Concours & Résultats'), href: '/concours',               icon: Award },
                { id: 'calculator', label: t('concoursPage.calculator', "Calculateur d'éligibilité"), href: '/admissions/calculateur', icon: Sparkles },
                { id: 'registration', label: t('concoursPage.fileDeposit', 'Commencer mon inscription'), href: '/concours',               icon: UploadCloud },
                { id: 'tracking', label: t('concoursPage.tracking', 'Suivi en temps réel'),       href: '/admissions/suivi',       icon: FileCheck },
              ].map((item) => {
                const IconComp = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="inline-flex items-center justify-center sm:justify-start gap-2 rounded-xl border border-white/15 bg-white/15 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/25 hover:border-[#D4AF37] hover:text-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    <IconComp size={16} aria-hidden="true" className="text-[#D4AF37]" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Action admin si connecté */}
          {(canManageConcours || canManagePreinscriptions) && (
            <div className="mt-6 flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/60 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-200">
                  Mode gestionnaire activé ({userRole || 'Admin'})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {canManagePreinscriptions && (
                  <button
                    onClick={() => void handleShowPreRegistrations()}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 px-4 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-900/50"
                  >
                    <Users size={16} />
                    Préinscriptions
                  </button>
                )}
                {canManageConcours && (
                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:brightness-110"
                  >
                    <Plus size={16} />
                    Publier un nouveau concours
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {!loading && (
        <section id="inscription" className="container-x px-4 pt-6 md:px-0">
          <div className="flex flex-col gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Inscription au concours</p>
              <h2 className="mt-1 text-lg font-black text-slate-900">
                {currentConcours ? currentConcours.title : 'Préinscription ouverte'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Préinscrivez-vous en un clic avec votre compte. Vous pourrez compléter votre dossier plus tard.
              </p>
              {preRegistrationMessage && <p role="status" className="mt-2 text-sm font-medium text-emerald-800">{preRegistrationMessage}</p>}
              {preRegistrationError && <p role="alert" className="mt-2 text-sm font-medium text-rose-700">{preRegistrationError}</p>}
            </div>
            {candidate?.admissionWorkflow?.preRegistration?.completedAt ? (
              <Link
                href={`/admissions/depot${candidate.admissionWorkflow.preRegistration.concoursSlug ? `?concours=${encodeURIComponent(candidate.admissionWorkflow.preRegistration.concoursSlug)}` : ''}`}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
              >
                Continuer mon dossier
              </Link>
            ) : (
              <button
                type="button"
                disabled={preRegistrationSaving}
                onClick={() => candidate?.email ? void handlePreRegistration() : router.push('/candidat')}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {preRegistrationSaving ? 'Enregistrement…' : candidate?.email ? 'Me préinscrire' : 'Se connecter pour se préinscrire'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* ── BARRE DE NAVIGATION DES ONGLETS & FILTRES ── */}
      <section className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container-x px-4 md:px-0">
          <div className="flex flex-col gap-4 py-3 md:flex-row md:items-center md:justify-between">
            {/* 3 ONGLETS EXPLICITES (Concours, Résultats, Historique) sur 1 seule ligne non scrollable */}
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 w-full lg:w-auto">
              <button
                onClick={() => setActiveTab('concours')}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'concours'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap size={15} className="shrink-0" />
                <span className="truncate">Concours</span>
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs ${
                    activeTab === 'concours' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {stats.enCours + stats.aVenir}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('resultats')}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'resultats'
                    ? 'bg-[#D4AF37] text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award size={15} className="shrink-0" />
                <span className="truncate">Résultats</span>
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs ${
                    activeTab === 'resultats' ? 'bg-slate-900 text-[#D4AF37]' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {stats.resultatsPublies}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('historique')}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'historique'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Archive size={15} className="shrink-0" />
                <span className="truncate">Historique</span>
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs ${
                    activeTab === 'historique' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {stats.termines}
                </span>
              </button>
            </div>

            {/* Barre de recherche et sélecteur d'année */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher filière, candidat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 sm:py-2 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Filtre Année */}
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">Toutes les années</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      Session {yr}
                    </option>
                  ))}
                </select>

                {/* Bouton Actualiser */}
                <button
                  onClick={fetchConcours}
                  title="Actualiser les informations"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 sm:py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
                  <span>Actualiser</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENU DES LISTES ── */}
      <section className="container-x mt-8 px-4 md:px-0">
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <RefreshCw size={28} className="animate-spin text-blue-600" />
            <p className="text-sm font-medium text-slate-500">Chargement des concours...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Award size={26} />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">Aucun élément trouvé</h3>
            <p className="mt-1 text-sm text-slate-500">
              Aucun concours ne correspond à vos critères de recherche actuels.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedYear('all');
              }}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : activeTab === 'resultats' && filteredItems.length > 0 && !filteredItems[0].results?.published ? (
          <div className="mx-auto max-w-3xl rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50 to-white p-8 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37] text-slate-950 shadow-md">
                <Bell size={32} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-3 py-1 text-xs font-bold text-amber-900">
                  <Clock size={14} />
                  Notification officielle : Résultats à venir
                </div>
                <h3 className="mt-3 text-2xl font-black text-slate-900">
                  Résultats de la session la plus récente en attente
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  Le concours le plus récent (<span className="font-bold text-slate-900">{filteredItems[0].title}</span>, Session {filteredItems[0].sessionYear}) est actuellement <span className="font-semibold text-blue-600">à venir ou en cours d&apos;évaluation</span>.
                  Les résultats officiels seront publiés sur cet espace dès leur proclamation par le jury et validation ministérielle.
                </p>
                {filteredItems[0].calendar?.resultsDate && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-100/70 p-3 text-xs font-bold text-amber-900">
                    <Calendar size={15} className="text-[#D4AF37]" />
                    <span>Publication prévisionnelle des résultats : {new Date(filteredItems[0].calendar.resultsDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => setSelectedConcours(filteredItems[0])}
                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-600 transition shadow"
                  >
                    Voir les détails du concours
                  </button>
                  <Link
                    href="/admissions/suivi"
                    className="rounded-xl border border-amber-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 hover:bg-amber-100 transition shadow-sm"
                  >
                    Suivre mon dossier de candidature
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const isTermine = item.status === 'termine';
              const isEnCours = item.status === 'en_cours';
              const hasResults = Boolean(item.results?.published);

              return (
                <div
                  key={item.id}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    hasResults
                      ? 'border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/20'
                      : isEnCours
                        ? 'border-blue-200'
                        : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* En-tête : Badges Statut et Année */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        Session {item.sessionYear}
                      </span>

                      {isEnCours && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          En cours
                        </span>
                      )}

                      {item.status === 'a_venir' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                          <Clock size={12} />
                          À venir
                        </span>
                      )}

                      {isTermine && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                          <Archive size={12} />
                          Terminé / Archivé
                        </span>
                      )}
                    </div>

                    {/* Titre */}
                    <h2 className="mt-4 text-lg font-black leading-snug text-slate-900 group-hover:text-blue-600">
                      <TranslatedText text={item.title} />
                    </h2>

                    <p className="mt-1 text-xs font-semibold text-blue-600"><TranslatedText text={item.department} /></p>

                    <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-3">
                      <TranslatedText text={item.description} />
                    </p>

                    {/* Calendrier succinct */}
                    <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                      {item.calendar?.registrationStart && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Ouverture inscriptions :</span>
                          <span className="font-semibold text-slate-800">
                            {new Date(item.calendar.registrationStart).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                      {item.calendar?.registrationEnd && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Date limite dépôt :</span>
                          <span className="font-semibold text-slate-800">
                            {new Date(item.calendar.registrationEnd).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                      {item.calendar?.examDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Épreuves écrites :</span>
                          <span className="font-semibold text-blue-700">
                            {new Date(item.calendar.examDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                      {item.calendar?.resultsDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Publication résultats :</span>
                          <span className="font-semibold text-slate-800">
                            {new Date(item.calendar.resultsDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                      {hasResults && (
                        <div className="flex items-center justify-between font-bold text-[#D4AF37]">
                          <span>Procès-Verbal :</span>
                          <span>Disponible</span>
                        </div>
                      )}
                    </div>

                    {item.attachments?.length > 0 && (
                      <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                        <Paperclip size={13} />
                        {item.attachments.length} document{item.attachments.length > 1 ? 's' : ''} joint{item.attachments.length > 1 ? 's' : ''}
                      </div>
                    )}

                    {/* Badge résultats si disponibles */}
                    {hasResults && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 border border-amber-200">
                        <CheckCircle2 size={16} className="text-[#D4AF37]" />
                        <span>Résultats officiels proclamés</span>
                      </div>
                    )}
                  </div>

                  {/* Boutons d'action */}
                  <div className="mt-6 flex flex-col gap-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedConcours(item)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600"
                      >
                        <span>{hasResults ? 'Voir les résultats & admis' : 'Détails & Conditions'}</span>
                        <ChevronRight size={14} />
                      </button>

                      {hasResults && item.results?.pdfUrl && (
                        <a
                          href={item.results.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37] text-slate-950 transition hover:scale-105"
                          title="Télécharger le PDF des résultats"
                        >
                          <Download size={16} />
                        </a>
                      )}
                    </div>

                    {/* Actions gestionnaire */}
                    {canManageConcours && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
                        >
                          <Edit size={14} />
                          <span>Modifier</span>
                        </button>
                        <DeleteButton onDelete={() => handleDeleteConcours(item.id)} label="Supprimer" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── MODAL DÉTAILS D'UN CONCOURS / RÉSULTATS ── */}
      {selectedConcours && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 sm:p-6 backdrop-blur-sm">
          <div className="relative my-4 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 sm:p-8 shadow-2xl">
            <button
              onClick={() => setSelectedConcours(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
              <Award size={16} />
              <span>Session {selectedConcours.sessionYear} • {selectedConcours.department}</span>
            </div>

            <h3 className="mt-2 text-2xl font-black text-slate-900">{selectedConcours.title}</h3>

            <p className="mt-3 text-sm text-slate-600">{selectedConcours.description}</p>

            <div className="mt-5 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:grid-cols-2">
              {selectedConcours.calendar?.registrationStart && (
                <div>
                  <span className="text-slate-400">Ouverture inscriptions</span>
                  <p className="font-semibold text-slate-800">
                    {new Date(selectedConcours.calendar.registrationStart).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
              {selectedConcours.calendar?.registrationEnd && (
                <div>
                  <span className="text-slate-400">Clôture inscriptions</span>
                  <p className="font-semibold text-slate-800">
                    {new Date(selectedConcours.calendar.registrationEnd).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
              {selectedConcours.calendar?.examDate && (
                <div>
                  <span className="text-slate-400">Date des épreuves</span>
                  <p className="font-semibold text-blue-700">
                    {new Date(selectedConcours.calendar.examDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
              {selectedConcours.calendar?.resultsDate && (
                <div>
                  <span className="text-slate-400">Publication des résultats</span>
                  <p className="font-semibold text-slate-800">
                    {new Date(selectedConcours.calendar.resultsDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>

            {/* Conditions d'admission */}
            {selectedConcours.conditions.length > 0 && (
              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Conditions d&apos;admission &amp; Profils requis
                </h4>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                  {selectedConcours.conditions.map((cond, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                      <span>{cond}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section RÉSULTATS DES ADMIS */}
            {selectedConcours.results?.published ? (
              <div className="mt-6 rounded-2xl border border-[#D4AF37]/50 bg-amber-50/50 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="text-[#D4AF37]" size={20} />
                    <h4 className="text-sm font-black text-slate-900">
                      Procès-Verbal des Résultats Officiels
                    </h4>
                  </div>
                  {selectedConcours.results.pdfUrl && (
                    <a
                      href={selectedConcours.results.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow transition hover:scale-105"
                    >
                      <Download size={14} />
                      Télécharger PV (PDF)
                    </a>
                  )}
                </div>

                {selectedConcours.results.notes && (
                  <p className="mt-2 text-xs italic text-slate-600">
                    « {selectedConcours.results.notes} »
                  </p>
                )}

                {/* Liste des admis */}
                {selectedConcours.results.admittedList?.length > 0 && (
                  <div className="mt-4">
                    <span className="text-xs font-bold text-emerald-800">
                      Candidats Admis ({selectedConcours.results.admittedList.length}) :
                    </span>
                    <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 divide-y divide-slate-100 text-xs">
                      {selectedConcours.results.admittedList.map((name, i) => (
                        <div key={i} className="py-1.5 font-medium text-slate-800">
                          {name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Liste d'attente */}
                {selectedConcours.results.waitingList?.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs font-bold text-amber-800">
                      Liste d&apos;attente ({selectedConcours.results.waitingList.length}) :
                    </span>
                    <div className="mt-1 max-h-32 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 divide-y divide-slate-100 text-xs">
                      {selectedConcours.results.waitingList.map((name, i) => (
                        <div key={i} className="py-1 text-slate-600">
                          {name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900">
                <span className="font-bold">Résultats en attente :</span> Les épreuves ou délibérations
                sont en cours. Les résultats officiels seront publiés directement sur cet onglet dès
                validation ministérielle.
              </div>
            )}

            {/* Pièces jointes / Règlements */}
            {selectedConcours.attachments?.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Documents officiels &amp; Fiches à télécharger
                </h4>
                <div className="mt-2 space-y-2">
                  {selectedConcours.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-700 hover:border-blue-500 hover:bg-blue-50/50"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-blue-600" />
                        <span>{att.name}</span>
                      </div>
                      <Download size={14} className="text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => setSelectedConcours(null)}
                className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreRegistrations && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm">
          <section className="my-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-bold uppercase text-blue-700">Gestion des concours</p>
                <h2 className="mt-1 text-xl font-black text-slate-900">Préinscriptions reçues</h2>
                <p className="mt-1 text-sm text-slate-500">{preRegistrations.length} candidat{preRegistrations.length > 1 ? 's' : ''}</p>
              </div>
              <button type="button" onClick={() => setShowPreRegistrations(false)} aria-label="Fermer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </header>
            {preRegistrationError && <p role="alert" className="mt-4 text-sm text-rose-700">{preRegistrationError}</p>}
            {preRegistrationsLoading ? (
              <p className="py-10 text-center text-sm text-slate-500">Chargement…</p>
            ) : preRegistrations.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">Aucune préinscription enregistrée pour le moment.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[650px] border-collapse text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-3 pr-4">Candidat</th>
                      <th className="py-3 pr-4">Contact</th>
                      <th className="py-3 pr-4">Concours</th>
                      <th className="py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preRegistrations.map((candidate) => (
                      <tr key={candidate.id}>
                        <td className="py-3 pr-4 font-semibold text-slate-900">{candidate.full_name}</td>
                        <td className="py-3 pr-4 text-slate-600"><a href={`mailto:${candidate.email}`} className="block hover:text-blue-700">{candidate.email}</a><a href={`tel:${candidate.phone}`} className="mt-1 block text-xs hover:text-blue-700">{candidate.phone}</a></td>
                        <td className="py-3 pr-4 text-slate-600">{concours.find((item) => item.slug === candidate.concours_slug)?.title || candidate.concours_slug}</td>
                        <td className="py-3 text-slate-600">{new Date(candidate.created_at).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── MODAL D'ADMINISTRATION POUR CRÉATION / MODIFICATION DE CONCOURS ── */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 sm:p-6 backdrop-blur-sm">
          <div className="relative my-4 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 sm:p-8 shadow-2xl">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900">
              {editingItem ? 'Modifier le concours' : 'Publier un nouveau concours'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Les concours créés ou modifiés sont immédiatement synchronisés sur le portail public.
            </p>

            {formError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveConcours} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Titre officiel du concours *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex. Concours d'Entrée DTS — Session 2026"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Filière / Département</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="Informatique, Télécoms"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Année de session</label>
                  <input
                    type="number"
                    value={formYear}
                    onChange={(e) => setFormYear(parseInt(e.target.value, 10))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Statut du concours</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ConcoursStatus)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="en_cours">En cours (inscriptions)</option>
                    <option value="a_venir">À venir</option>
                    <option value="termine">Terminé (archive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Description / Modalités</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Présentation des épreuves, niveau requis..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Début inscriptions</label>
                  <input
                    type="date"
                    value={formRegStart}
                    onChange={(e) => setFormRegStart(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Clôture inscriptions</label>
                  <input
                    type="date"
                    value={formRegEnd}
                    onChange={(e) => setFormRegEnd(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Date des épreuves</label>
                  <input
                    type="date"
                    value={formExamDate}
                    onChange={(e) => setFormExamDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Date des résultats</label>
                  <input
                    type="date"
                    value={formResultsDate}
                    onChange={(e) => setFormResultsDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Conditions d&apos;admission (une par ligne)
                </label>
                <textarea
                  rows={2}
                  value={formConditions}
                  onChange={(e) => setFormConditions(e.target.value)}
                  placeholder="Être titulaire du Baccalauréat..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Paperclip size={14} className="text-blue-600" />
                    Pièces jointes ({formAttachments.length})
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.zip"
                    onChange={(e) => void uploadFiles(e.target.files, 'docs')}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || !token}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
                    {isUploading ? 'Téléversement…' : 'Ajouter un fichier'}
                  </button>
                </div>
                {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
                {formAttachments.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {formAttachments.map((file, i) => (
                      <div
                        key={`${file.url}-${i}`}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={15} className="shrink-0 text-blue-600" />
                          <span className="truncate font-medium text-slate-800">{file.name}</span>
                          {file.size ? <span className="text-slate-400">({formatFileSize(file.size)})</span> : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                          className="ml-2 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs italic text-slate-400">
                    Arrêté, fiche d&apos;inscription, règlement, etc. PDF, Word, Excel, images (15 Mo max).
                  </p>
                )}
              </div>

              {/* RÉSULTATS DU CONCOURS */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="publier-resultats"
                    checked={formResultsPublished}
                    onChange={(e) => setFormResultsPublished(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600"
                  />
                  <label htmlFor="publier-resultats" className="text-xs font-bold text-slate-900 cursor-pointer">
                    Publier officiellement les résultats de ce concours
                  </label>
                </div>

                {formResultsPublished && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Procès-Verbal officiel (PDF)
                      </label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="text"
                          value={formResultsPdf}
                          onChange={(e) => setFormResultsPdf(e.target.value)}
                          placeholder="https://.../pv_resultats.pdf ou téléversez un fichier"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                        />
                        <input
                          ref={pvInputRef}
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => void uploadFiles(e.target.files, 'pv')}
                        />
                        <button
                          type="button"
                          onClick={() => pvInputRef.current?.click()}
                          disabled={isUploadingPv || !token}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 disabled:opacity-50"
                        >
                          {isUploadingPv ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
                          PDF
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Note officielle / communiqué
                      </label>
                      <textarea
                        rows={2}
                        value={formResultsNotes}
                        onChange={(e) => setFormResultsNotes(e.target.value)}
                        placeholder="Les candidats admis sont priés de se présenter à la scolarité..."
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Liste des admis (un nom par ligne)
                      </label>
                      <textarea
                        rows={3}
                        value={formAdmittedText}
                        onChange={(e) => setFormAdmittedText(e.target.value)}
                        placeholder="MBOUMBA Jean-Pierre — Mention Bien&#10;NZAMBA Claire..."
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Liste d&apos;attente (un nom par ligne)
                      </label>
                      <textarea
                        rows={2}
                        value={formWaitingText}
                        onChange={(e) => setFormWaitingText(e.target.value)}
                        placeholder="1. ONDO Guy..."
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSaving ? 'Enregistrement...' : 'Enregistrer le concours'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
