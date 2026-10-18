'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Loader2,
  Lock,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  UploadCloud,
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
import { authClient } from '@/lib/auth-client';
import { canAccessStaffService } from '@/lib/roles';
import { PublicationAttachment, ResearchPublication } from '@/types/publication';
import TranslatedText from '@/components/TranslatedText';

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

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
  const [deletingPublicationId, setDeletingPublicationId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

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
  const [userService, setUserService] = useState<string | null>(null);
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
  const [formAttachments, setFormAttachments] = useState<PublicationAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Session
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

  const isStaff = canAccessStaffService(userRole, 'publications', userService);

  const fetchPublications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/publications', { cache: 'no-store' });
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
    setFormAttachments([]);
    setUploadError('');
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
    setFormAttachments(Array.isArray(pub.attachments) ? pub.attachments : []);
    setUploadError('');
    setFormError('');
    setShowAdminModal(true);
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !token) return;
    setIsUploading(true);
    setUploadError('');

    try {
      const data = new FormData();
      Array.from(files).forEach((f) => data.append('files', f));
      const res = await fetch('/api/publications/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Erreur lors du téléversement.');
      const uploaded: PublicationAttachment[] = json.data || [];
      setFormAttachments((prev) => [...prev, ...uploaded]);
      const firstPdf = uploaded.find(
        (f) => (f.type || '').includes('pdf') || f.name.toLowerCase().endsWith('.pdf')
      );
      if (firstPdf && !formPdfUrl) {
        setFormPdfUrl(firstPdf.url);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur de téléversement.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
      pdfUrl: formPdfUrl || formAttachments.find((a) => a.name.toLowerCase().endsWith('.pdf'))?.url || null,
      attachments: formAttachments,
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
    if (!token) {
      setDeleteError('Session expirée, veuillez vous reconnecter.');
      return;
    }

    setDeletingPublicationId(id);
    setDeleteError('');
    try {
      const res = await fetch(`/api/publications?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Impossible de supprimer la publication.');
      setPublications((current) => current.filter((publication) => publication.id !== id));
      await fetchPublications();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Impossible de supprimer la publication.');
    } finally {
      setDeletingPublicationId(null);
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
      <section className="relative isolate overflow-hidden text-white bg-slate-950">
        <img src="/banniere/7.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.88) 30%, rgba(15, 23, 42, 0.48) 50%, rgba(30, 136, 168, 0.16) 75%, rgba(30, 136, 168, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <div className="flex items-center justify-between gap-6">
            <div className="max-w-3xl">
              <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
              <h1 className="text-4xl font-black md:text-6xl">{t('publicationsPage.title', 'Publications des Chercheurs de l’INPTIC')}</h1>
              <p className="mt-5 max-w-3xl text-lg text-slate-200">
                {t('publicationsPage.intro', 'Explorez les travaux de recherche, articles de revues et actes de conférences publiés par le corps professoral et les laboratoires de l’Institut.')}
              </p>
            </div>

            <div className="hidden md:block rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md text-center min-w-[200px]">
              <span className="text-4xl font-black text-white">{publications.length}</span>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                {t('publicationsPage.referencedWorks', 'Travaux Référencés')}
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
        {deleteError && (
          <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {deleteError}
          </p>
        )}
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
                      <TranslatedText text={pub.title} />
                    </h2>

                    {/* Auteurs */}
                    <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Users size={14} className="text-slate-400 shrink-0" />
                      <span>{pub.authors.join(' • ')}</span>
                    </div>

                    {/* Résumé */}
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      <TranslatedText text={pub.abstract} />
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

                    {pub.attachments?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {pub.attachments.map((file, i) => (
                          <a
                            key={`${file.url}-${i}`}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-400 hover:bg-blue-50"
                          >
                            <Paperclip size={12} className="text-blue-600" />
                            {file.name}
                            {file.size ? (
                              <span className="font-normal text-slate-400">({formatFileSize(file.size)})</span>
                            ) : null}
                          </a>
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
                          disabled={deletingPublicationId === pub.id}
                          className="text-xs font-semibold text-slate-500 hover:text-red-600 disabled:cursor-wait disabled:opacity-50"
                        >
                          {deletingPublicationId === pub.id ? 'Suppression…' : 'Supprimer'}
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
                <label className="block text-xs font-bold text-slate-700">URL du document PDF principal</label>
                <input
                  type="text"
                  value={formPdfUrl}
                  onChange={(e) => setFormPdfUrl(e.target.value)}
                  placeholder="https://.../article.pdf ou téléversez un fichier ci-dessous"
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
                    onChange={(e) => void uploadFiles(e.target.files)}
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
                    Article PDF, annexes, poster, présentation. Formats : PDF, Word, Excel, images, ZIP (15 Mo max).
                  </p>
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
