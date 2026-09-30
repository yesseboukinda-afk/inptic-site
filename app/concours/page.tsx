'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
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
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  Users,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  Archive,
  Edit,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { isStaffOrAdminUser } from '@/lib/roles';
import { ConcoursItem, ConcoursStatus } from '@/types/concours';

export default function ConcoursPage() {
  const { t } = useTranslation();

  const [concours, setConcours] = useState<ConcoursItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'concours' | 'resultats' | 'historique'>('concours');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modal détails / résultat sélectionné
  const [selectedConcours, setSelectedConcours] = useState<ConcoursItem | null>(null);

  // Authentification & Rôles
  const [userRole, setUserRole] = useState<string | null>(null);
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

  // Vérification de session
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (session) {
        setToken(session.access_token);
        setUserEmail(session.user?.email || null);
        const role =
          session.user?.app_metadata?.role ||
          session.user?.user_metadata?.role ||
          null;
        setUserRole(role);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || null);
      setUserEmail(session?.user?.email || null);
      const role =
        session?.user?.app_metadata?.role ||
        session?.user?.user_metadata?.role ||
        null;
      setUserRole(role);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isStaff = isStaffOrAdminUser(userEmail, userRole);

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
  }, []);

  // Années disponibles
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    concours.forEach((c) => set.add(c.sessionYear));
    return Array.from(set).sort((a, b) => b - a);
  }, [concours]);

  // Filtrage selon l'onglet
  const filteredItems = useMemo(() => {
    let list = concours;

    // Filtre onglet
    if (activeTab === 'concours') {
      // Concours en cours ou à venir
      list = list.filter((c) => c.status === 'en_cours' || c.status === 'a_venir');
    } else if (activeTab === 'resultats') {
      // Uniquement ceux ayant des résultats publiés ou prêts
      list = list.filter((c) => c.results?.published || c.status === 'termine');
    } else if (activeTab === 'historique') {
      // Uniquement les concours passés / terminés
      list = list.filter((c) => c.status === 'termine');
    }

    // Filtre année
    if (selectedYear !== 'all') {
      list = list.filter((c) => c.sessionYear === parseInt(selectedYear, 10));
    }

    // Filtre statut secondaire (si sur onglet concours)
    if (activeTab === 'concours' && selectedStatusFilter !== 'all') {
      list = list.filter((c) => c.status === selectedStatusFilter);
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
  }, [concours, activeTab, selectedYear, selectedStatusFilter, searchQuery]);

  // Statistiques
  const stats = useMemo(() => {
    const enCours = concours.filter((c) => c.status === 'en_cours').length;
    const aVenir = concours.filter((c) => c.status === 'a_venir').length;
    const termines = concours.filter((c) => c.status === 'termine').length;
    const resultatsPublies = concours.filter((c) => c.results?.published).length;
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
    setFormConditions(item.conditions.join('\n'));
    setFormExamDate(item.calendar?.examDate ? item.calendar.examDate.slice(0, 10) : '');
    setFormRegStart(item.calendar?.registrationStart ? item.calendar.registrationStart.slice(0, 10) : '');
    setFormRegEnd(item.calendar?.registrationEnd ? item.calendar.registrationEnd.slice(0, 10) : '');
    setFormResultsPublished(Boolean(item.results?.published));
    setFormResultsPdf(item.results?.pdfUrl || '');
    setFormAdmittedText(item.results?.admittedList?.join('\n') || '');
    setFormWaitingText(item.results?.waitingList?.join('\n') || '');
    setFormResultsNotes(item.results?.notes || '');
    setFormError('');
    setShowAdminModal(true);
  };

  // Gestion Admin : Enregistrer
  const handleSaveConcours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setFormError('Session expirée, veuillez vous reconnecter.');
      return;
    }

    setFormSaving(true);
    setFormError('');

    const payload = {
      id: editingItem?.id,
      title: formTitle,
      department: formDepartment,
      sessionYear: formYear,
      status: formStatus,
      description: formDescription,
      conditions: formConditions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      calendar: {
        registrationStart: formRegStart ? new Date(formRegStart).toISOString() : null,
        registrationEnd: formRegEnd ? new Date(formRegEnd).toISOString() : null,
        examDate: formExamDate ? new Date(formExamDate).toISOString() : null,
        resultsDate: formResultsPublished ? new Date().toISOString() : null,
      },
      results: {
        published: formResultsPublished,
        publishedAt: formResultsPublished ? new Date().toISOString() : null,
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce concours ?')) return;
    if (!token) return;

    try {
      const res = await fetch(`/api/concours?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchConcours();
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ── BANNIÈRE HÉRO DU PORTAIL CONCOURS ── */}
      <section className="relative overflow-hidden bg-slate-950 py-16 text-white md:py-24">
        {/* Cercles de fond lumineux */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#D4AF37]/15 blur-3xl" />

        <div className="container-x relative z-10 px-4 md:px-0">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                <Award size={14} className="text-[#D4AF37]" />
                Portail Officiel des Concours d&apos;Entrée
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Concours, Admissions &amp; Résultats
              </h1>

              <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
                Consultez les concours ouverts et à venir pour intégrer l&apos;INPTIC Gabon,
                téléchargez les règlements officiels et accédez aux procès-verbaux des résultats.
              </p>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
                <span className="text-2xl font-black text-white">{stats.enCours}</span>
                <p className="mt-1 text-xs font-medium text-emerald-400">En cours</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
                <span className="text-2xl font-black text-white">{stats.aVenir}</span>
                <p className="mt-1 text-xs font-medium text-amber-400">À venir</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
                <span className="text-2xl font-black text-white">{stats.termines}</span>
                <p className="mt-1 text-xs font-medium text-slate-400">Archives</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
                <span className="text-2xl font-black text-[#D4AF37]">{stats.resultatsPublies}</span>
                <p className="mt-1 text-xs font-medium text-[#D4AF37]">Résultats dispo</p>
              </div>
            </div>
          </div>

          {/* Raccourcis Admissions */}
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Admissions &amp; Concours
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Guide d'admission",         href: '/admissions/guide',        icon: '📋' },
                { label: 'Concours & Résultats',      href: '/concours',                icon: '🏆' },
                { label: "Calculateur d'éligibilité", href: '/admissions/calculateur',  icon: '🧮' },
                { label: 'Dépôt de dossier',          href: '/admissions/depot',        icon: '📂' },
                { label: 'Suivi en temps réel',       href: '/admissions/suivi',        icon: '📡' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 hover:border-[#D4AF37] hover:text-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Action admin si connecté */}
          {isStaff && (
            <div className="mt-8 flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-200">
                  Mode gestionnaire activé ({userRole || 'Admin'})
                </span>
              </div>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:brightness-110"
              >
                <Plus size={16} />
                Publier un nouveau concours
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── BARRE DE NAVIGATION DES ONGLETS & FILTRES ── */}
      <section className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container-x px-4 md:px-0">
          <div className="flex flex-col gap-4 py-3 md:flex-row md:items-center md:justify-between">
            {/* 3 ONGLETS EXPLICITES (Concours, Résultats des concours, Historique des concours) */}
            <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setActiveTab('concours')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  activeTab === 'concours'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap size={16} />
                <span>Concours</span>
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                    activeTab === 'concours' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {stats.enCours + stats.aVenir}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('resultats')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  activeTab === 'resultats'
                    ? 'bg-[#D4AF37] text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award size={16} />
                <span>Résultats des concours</span>
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                    activeTab === 'resultats' ? 'bg-slate-900 text-[#D4AF37]' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {stats.resultatsPublies}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('historique')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  activeTab === 'historique'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Archive size={16} />
                <span>Historique des concours</span>
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                    activeTab === 'historique' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {stats.termines}
                </span>
              </button>
            </div>

            {/* Barre de recherche et sélecteur d'année */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher filière, candidat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Filtre Année */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Toutes les années</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Session {yr}
                  </option>
                ))}
              </select>

              {/* Filtre statut (si onglet concours) */}
              {activeTab === 'concours' && (
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="en_cours">En cours d&apos;inscription</option>
                  <option value="a_venir">À venir prochainement</option>
                </select>
              )}
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
                setSelectedStatusFilter('all');
              }}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
            >
              Réinitialiser les filtres
            </button>
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
                      {item.title}
                    </h2>

                    <p className="mt-1 text-xs font-semibold text-blue-600">{item.department}</p>

                    <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-3">
                      {item.description}
                    </p>

                    {/* Calendrier succinct */}
                    <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
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
                      {hasResults && (
                        <div className="flex items-center justify-between font-bold text-[#D4AF37]">
                          <span>Procès-Verbal :</span>
                          <span>Disponible</span>
                        </div>
                      )}
                    </div>

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
                    {isStaff && (
                      <div className="flex items-center justify-end gap-2 pt-1 text-xs">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600"
                        >
                          <Edit size={13} />
                          <span>Modifier</span>
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => handleDeleteConcours(item.id)}
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600"
                        >
                          <Trash2 size={13} />
                          <span>Supprimer</span>
                        </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
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

            <div className="mt-6 flex justify-end">
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

      {/* ── MODAL D'ADMINISTRATION POUR CRÉATION / MODIFICATION DE CONCOURS ── */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
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

              <div className="grid gap-3 sm:grid-cols-3">
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
                        URL du Procès-Verbal officiel (PDF)
                      </label>
                      <input
                        type="text"
                        value={formResultsPdf}
                        onChange={(e) => setFormResultsPdf(e.target.value)}
                        placeholder="https://.../pv_resultats.pdf"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white"
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
