'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  User,
  Users,
  X,
  Edit,
  Trash2,
  ArrowLeft,
  Share2,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { isStaffOrAdminUser } from '@/lib/roles';
import { ResearchPublication } from '@/types/publication';

const DOMAINS_LIST = [
  'Tous les domaines',
  'Intelligence Artificielle',
  'Cybersécurité',
  'Réseaux & Télécoms',
  'Systèmes Embarqués & IoT',
  'Génie Logiciel',
  'Management des TIC',
];

export default function PublicationsPage() {
  const { t } = useTranslation();

  const [publications, setPublications] = useState<ResearchPublication[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('Tous les domaines');
  const [selectedYear, setSelectedYear] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('');

  // Détails publication
  const [activePubDetail, setActivePubDetail] = useState<ResearchPublication | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Authentification & Rôles
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Modal Admin
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ResearchPublication | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Formulaire publication
  const [formTitle, setFormTitle] = useState('');
  const [formAuthors, setFormAuthors] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formDomain, setFormDomain] = useState('Intelligence Artificielle');
  const [formAbstract, setFormAbstract] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [formJournal, setFormJournal] = useState('');
  const [formDoi, setFormDoi] = useState('');
  const [formPdfUrl, setFormPdfUrl] = useState('');

  // Session
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

  const fetchPublications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/publications');
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setPublications(json.data);
      }
    } catch (err) {
      console.error('Erreur chargement publications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, []);

  // Années disponibles
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    publications.forEach((p) => set.add(p.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [publications]);

  // Filtrage
  const filteredPublications = useMemo(() => {
    let list = publications;

    if (selectedDomain !== 'Tous les domaines') {
      list = list.filter((p) => p.domain.toLowerCase() === selectedDomain.toLowerCase());
    }

    if (selectedYear !== 'all') {
      list = list.filter((p) => p.year === parseInt(selectedYear, 10));
    }

    if (authorFilter.trim()) {
      const af = authorFilter.toLowerCase();
      list = list.filter((p) => p.authors.some((author) => author.toLowerCase().includes(af)));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.abstract.toLowerCase().includes(q) ||
          p.keywords.some((k) => k.toLowerCase().includes(q)) ||
          p.authors.some((author) => author.toLowerCase().includes(q))
      );
    }

    return list;
  }, [publications, selectedDomain, selectedYear, authorFilter, searchQuery]);

  // Actions Admin
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormAuthors('Dr. Jean-Marc ONDO, M. Christian BOURDES');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormYear(new Date().getFullYear());
    setFormDomain('Intelligence Artificielle');
    setFormAbstract('');
    setFormKeywords('IA, Machine Learning, Gabon');
    setFormJournal('');
    setFormDoi('');
    setFormPdfUrl('');
    setFormError('');
    setShowAdminModal(true);
  };

  const handleOpenEdit = (pub: ResearchPublication) => {
    setEditingItem(pub);
    setFormTitle(pub.title);
    setFormAuthors(pub.authors.join(', '));
    setFormDate(pub.publicationDate ? pub.publicationDate.slice(0, 10) : '');
    setFormYear(pub.year);
    setFormDomain(pub.domain);
    setFormAbstract(pub.abstract);
    setFormKeywords(pub.keywords.join(', '));
    setFormJournal(pub.journalOrConference || '');
    setFormDoi(pub.doiOrUrl || '');
    setFormPdfUrl(pub.pdfUrl || '');
    setFormError('');
    setShowAdminModal(true);
  };

  const handleSavePublication = async (e: React.FormEvent) => {
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
      authors: formAuthors
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      publicationDate: formDate,
      year: formYear,
      domain: formDomain,
      abstract: formAbstract,
      keywords: formKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
      journalOrConference: formJournal || null,
      doiOrUrl: formDoi || null,
      pdfUrl: formPdfUrl || null,
    };

    try {
      const url = '/api/publications';
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
        throw new Error(json.error || 'Erreur lors de la sauvegarde');
      }

      setShowAdminModal(false);
      await fetchPublications();
    } catch (err: any) {
      setFormError(err.message || 'Erreur inattendue.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeletePublication = async (id: string) => {
    if (!confirm('Supprimer définitivement cette publication ?')) return;
    if (!token) return;

    try {
      const res = await fetch(`/api/publications?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchPublications();
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const copyShareLink = (id: string) => {
    const url = `${window.location.origin}/recherche/publications#${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ── BANNIÈRE HÉRO ── */}
      <section className="relative overflow-hidden bg-slate-950 py-16 text-white md:py-24">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="container-x relative z-10 px-4 md:px-0">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                <BookOpen size={14} className="text-[#D4AF37]" />
                Recherche Appliquée &amp; Innovation Scientifique
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Publications des Chercheurs de l&apos;INPTIC
              </h1>

              <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
                Explorez les travaux de recherche, articles de revues et actes de conférences publiés par le corps professoral et les laboratoires de l&apos;Institut National de la Poste, des Technologies de l&apos;Information et de la Communication du Gabon.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md text-center min-w-[200px]">
              <span className="text-4xl font-black text-white">{publications.length}</span>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                Travaux Référencés
              </p>
            </div>
          </div>

          {/* Mode Admin */}
          {isStaff && (
            <div className="mt-8 flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-200">
                  Espace d&apos;administration des publications ({userRole || 'Admin'})
                </span>
              </div>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:brightness-110"
              >
                <Plus size={16} />
                Ajouter une publication
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── BARRE DE FILTRES ET RECHERCHE ── */}
      <section className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container-x px-4 md:px-0">
          <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
            {/* Barre de recherche */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par titre, mot-clé, résumé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Sélecteurs Domaine, Année, Auteur */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                {DOMAINS_LIST.map((dom) => (
                  <option key={dom} value={dom}>
                    {dom}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Toutes les années</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Année {yr}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Filtrer par auteur..."
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── LISTE DES PUBLICATIONS ── */}
      <section className="container-x mt-8 px-4 md:px-0">
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <RefreshCw size={28} className="animate-spin text-blue-600" />
            <p className="text-sm font-medium text-slate-500">Chargement des publications scientifiques...</p>
          </div>
        ) : filteredPublications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <BookOpen size={26} />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">Aucune publication trouvée</h3>
            <p className="mt-1 text-sm text-slate-500">
              Modifiez vos critères de recherche ou réinitialisez les filtres.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDomain('Tous les domaines');
                setSelectedYear('all');
                setAuthorFilter('');
              }}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPublications.map((pub) => (
              <article
                key={pub.id}
                id={pub.id}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:border-blue-300 hover:shadow-lg"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    {/* Domaine et Année */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {pub.domain}
                      </span>
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {pub.year}
                      </span>
                      {pub.journalOrConference && (
                        <span className="text-xs italic text-slate-500">
                          {pub.journalOrConference}
                        </span>
                      )}
                    </div>

                    {/* Titre */}
                    <h2 className="mt-3 text-lg font-black text-slate-900 group-hover:text-blue-600 transition">
                      {pub.title}
                    </h2>

                    {/* Auteurs */}
                    <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Users size={14} className="text-slate-400 shrink-0" />
                      <span>{pub.authors.join(' • ')}</span>
                    </div>

                    {/* Résumé */}
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {pub.abstract}
                    </p>

                    {/* Mots-clés */}
                    {pub.keywords.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {pub.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                          >
                            <Tag size={10} className="text-slate-400" />
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions à droite */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0">
                    {pub.pdfUrl && (
                      <a
                        href={pub.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-600"
                      >
                        <Download size={14} />
                        <span>Télécharger PDF</span>
                      </a>
                    )}

                    {pub.doiOrUrl && (
                      <a
                        href={pub.doiOrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <ExternalLink size={14} />
                        <span>Consulter source</span>
                      </a>
                    )}

                    <button
                      onClick={() => copyShareLink(pub.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                      title="Copier le lien"
                      aria-label="Copier le lien"
                    >
                      {copiedId === pub.id ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                    </button>

                    {/* Actions Staff */}
                    {isStaff && (
                      <div className="mt-2 flex items-center gap-2 pt-2 border-t border-slate-100 w-full justify-end">
                        <button
                          onClick={() => handleOpenEdit(pub)}
                          className="text-xs font-semibold text-slate-500 hover:text-blue-600"
                        >
                          Modifier
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          onClick={() => handleDeletePublication(pub.id)}
                          className="text-xs font-semibold text-slate-500 hover:text-red-600"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── MODAL ADMIN CRÉATION / MODIFICATION ── */}
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
              {editingItem ? 'Modifier la publication' : 'Ajouter une publication scientifique'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Renseignez les détails des travaux de recherche pour publication sur le portail officiel.
            </p>

            {formError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSavePublication} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Titre de l&apos;article ou travail scientifique *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex. Déploiement et Résilience des Réseaux de Capteurs IoT..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Auteurs (séparés par des virgules) *</label>
                <input
                  type="text"
                  required
                  value={formAuthors}
                  onChange={(e) => setFormAuthors(e.target.value)}
                  placeholder="Dr. Jean-Marc ONDO, Ing. Patrick MVE..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Domaine de recherche</label>
                  <select
                    value={formDomain}
                    onChange={(e) => setFormDomain(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {DOMAINS_LIST.filter((d) => d !== 'Tous les domaines').map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Année</label>
                  <input
                    type="number"
                    value={formYear}
                    onChange={(e) => setFormYear(parseInt(e.target.value, 10))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Date de parution</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Résumé (Abstract) *</label>
                <textarea
                  rows={4}
                  required
                  value={formAbstract}
                  onChange={(e) => setFormAbstract(e.target.value)}
                  placeholder="Résumé méthodologique, résultats et conclusions..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Mots-clés (séparés par des virgules)</label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="IoT, LoRaWAN, Réseaux, Gabon"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Revue ou Conférence</label>
                  <input
                    type="text"
                    value={formJournal}
                    onChange={(e) => setFormJournal(e.target.value)}
                    placeholder="Ex. RATIT 2026, IEEE Africa..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Lien DOI ou Web externe</label>
                  <input
                    type="text"
                    value={formDoi}
                    onChange={(e) => setFormDoi(e.target.value)}
                    placeholder="https://doi.org/..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">URL du document PDF téléchargeable</label>
                <input
                  type="text"
                  value={formPdfUrl}
                  onChange={(e) => setFormPdfUrl(e.target.value)}
                  placeholder="https://.../article.pdf ou /docs/publications/..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
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
                  {formSaving ? 'Enregistrement...' : 'Enregistrer la publication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
