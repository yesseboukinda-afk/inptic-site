'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle, ArrowLeft, Calendar, CheckCircle2, ChevronDown, ChevronUp,
  Copy, Download, ExternalLink, Eye, Facebook, FileEdit, FileText,
  Globe, Loader2, Megaphone, MessageCircle, Paperclip, Pencil, Plus,
  RefreshCw, Tag, Trash2, UploadCloud, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

/* ─────────────────────────── types ── */
export type Attachment = {
  name: string;
  url: string;
  size?: number;
  type?: string;
  path?: string;
};

export type SocialLink = {
  label: string;
  url: string;
};

type Publication = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  attachments?: Attachment[];
  socialLinks?: SocialLink[];
  publishedAt: string | null;
  createdAt: string | null;
};

type PublicationForm = {
  title: string;
  excerpt: string;
  category: string;
  attachments: Attachment[];
  socialLinks: SocialLink[];
};

/* ─────────────────────── constants ── */
const EMPTY_FORM: PublicationForm = {
  title: '',
  excerpt: '',
  category: 'Annonce',
  attachments: [],
  socialLinks: [],
};

const CATEGORIES = ['Annonce', 'Événement', 'Concours', 'Communiqué', 'Vie étudiante'];
const SOCIAL_PRESETS = ['Instagram', 'Facebook', 'LinkedIn', 'X (Twitter)', 'YouTube', 'TikTok', 'Site web'];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; bar: string }> = {
  'Annonce':         { bg: 'bg-blue-50',    text: 'text-blue-700',    bar: 'bg-blue-500'   },
  'Événement':       { bg: 'bg-purple-50',  text: 'text-purple-700',  bar: 'bg-purple-500' },
  'Concours':        { bg: 'bg-amber-50',   text: 'text-amber-700',   bar: 'bg-amber-500'  },
  'Communiqué':      { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500'},
  'Vie étudiante':   { bg: 'bg-pink-50',    text: 'text-pink-700',    bar: 'bg-pink-500'   },
};
const DEFAULT_STYLE = { bg: 'bg-slate-50', text: 'text-slate-700', bar: 'bg-slate-400' };

/* ─────────────────────────── utils ── */
const catStyle = (c: string) => CATEGORY_STYLES[c] ?? DEFAULT_STYLE;

const fmtDate = (v: string | null) =>
  v ? new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

const fmtTime = (v: string | null) =>
  v ? new Date(v).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function shareUrl(pub: Publication) {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/annonces#${encodeURIComponent(pub.slug)}`;
}

function renderSocialIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('face')) return <Facebook size={12} />;
  if (l.includes('link')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" aria-hidden="true">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    );
  }
  if (l.includes('twit') || l === 'x' || l.includes('x (')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.257 5.63 5.907-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
      </svg>
    );
  }
  if (l.includes('insta')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }
  if (l.includes('you')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }
  return <ExternalLink size={12} />;
}

/* ──────────────────── DeleteConfirm mini-modal ── */
function DeleteConfirm({
  title, onConfirm, onCancel, loading,
}: { title: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-red-100 p-2 text-red-600"><Trash2 size={18} /></span>
          <div>
            <p className="font-bold text-slate-900">Supprimer cette annonce ?</p>
            <p className="mt-1 text-sm text-slate-500 line-clamp-2">« {title} »</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-400">Cette action est irréversible. L&apos;annonce sera retirée de la page publique immédiatement.</p>
        <div className="mt-5 flex gap-3">
          <button onClick={onCancel} disabled={loading} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {loading ? <Loader2 size={15} className="mx-auto animate-spin" /> : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────── PublicationCard ── */
function PublicationCard({
  pub, onEdit, onDelete,
}: { pub: Publication; onEdit: () => void; onDelete: () => void; token: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const style = catStyle(pub.category);
  const isPublished = Boolean(pub.publishedAt);
  const url = shareUrl(pub);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${pub.title} — ${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(pub.title)}&url=${encodeURIComponent(url)}`,
  };

  const hasAttachments = Boolean(pub.attachments && pub.attachments.length > 0);
  const hasSocials = Boolean(pub.socialLinks && pub.socialLinks.length > 0);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Status bar */}
      <div className={`flex items-center justify-between px-5 py-2.5 text-xs font-bold ${isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
        <span className="flex items-center gap-1.5">
          {isPublished ? <Globe size={12} /> : <FileEdit size={12} />}
          {isPublished ? `Publiée le ${fmtDate(pub.publishedAt)} à ${fmtTime(pub.publishedAt)}` : 'Brouillon'}
        </span>
        <div className="flex items-center gap-2">
          {isPublished && (
            <Link href={`/annonces#${encodeURIComponent(pub.slug)}`} target="_blank"
              className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] hover:bg-emerald-200">
              <Eye size={10} /> Voir en public
            </Link>
          )}
        </div>
      </div>

      <div className="p-5">
        {/* Category + date */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${style.bg} ${style.text}`}>
            <Tag size={10} />{pub.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Calendar size={10} />{fmtDate(pub.createdAt)}
          </span>
          {hasAttachments && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
              <Paperclip size={10} />
              {pub.attachments!.length} pièce{pub.attachments!.length > 1 ? 's' : ''} jointe{pub.attachments!.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-3 text-xl font-black text-slate-900">{pub.title}</h3>

        {/* Excerpt / full text toggle */}
        <div className="mt-2 text-sm leading-7 text-slate-600">
          {expanded ? (
            <p className="whitespace-pre-wrap">{pub.excerpt}</p>
          ) : (
            <p className="line-clamp-3 whitespace-pre-wrap">{pub.excerpt}</p>
          )}
        </div>
        {pub.excerpt.length > 200 && (
          <button onClick={() => setExpanded(v => !v)}
            className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${style.text} hover:opacity-70`}>
            {expanded ? <><ChevronUp size={12} />Réduire</> : <><ChevronDown size={12} />Lire tout</>}
          </button>
        )}

        {/* Attachments preview */}
        {hasAttachments && (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Paperclip size={12} /> Fichiers joints ({pub.attachments!.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {pub.attachments!.map((file, i) => (
                <a
                  key={i}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
                >
                  <FileText size={13} className="text-blue-500" />
                  <span className="max-w-[180px] truncate">{file.name}</span>
                  {file.size ? <span className="text-[10px] text-slate-400">({formatFileSize(file.size)})</span> : null}
                  <Download size={11} className="text-slate-400" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Social links preview */}
        {hasSocials && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Retrouver sur :</span>
            {pub.socialLinks!.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
              >
                {renderSocialIcon(s.label)}
                <span>{s.label}</span>
              </a>
            ))}
          </div>
        )}

        {/* Actions row */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          {/* Edit */}
          <button onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
            <Pencil size={13} />Modifier
          </button>

          {/* Delete */}
          <button onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600">
            <Trash2 size={13} />Supprimer
          </button>

          {/* Share — only when published */}
          {isPublished && (
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              {([
                { key: 'whatsapp', label: 'WA', href: shareLinks.whatsapp, icon: <MessageCircle size={12} />, cls: 'hover:border-green-400 hover:bg-green-50 hover:text-green-700' },
                { key: 'facebook', label: 'FB', href: shareLinks.facebook, icon: <Facebook size={12} />, cls: 'hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700' },
                { key: 'linkedin', label: 'LI', href: shareLinks.linkedin, icon: renderSocialIcon('linkedin'), cls: 'hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700' },
                { key: 'x', label: 'X', href: shareLinks.x, icon: renderSocialIcon('x'), cls: 'hover:border-slate-800 hover:bg-slate-900 hover:text-white' },
              ] as const).map(({ key, label, href, icon, cls }) => (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition ${cls}`}>
                  {icon}{label}
                </a>
              ))}
              <button onClick={() => void copy()}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50">
                <Copy size={12} />{copied ? 'Copié !' : 'Lien'}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* ────────────────────── Composer modal ── */
function Composer({
  editingId, initialForm, accessToken, onClose, onSaved,
}: {
  editingId: string | null;
  initialForm: PublicationForm;
  accessToken: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PublicationForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');

  // New social link input draft
  const [socialPreset, setSocialPreset] = useState('Instagram');
  const [socialCustomLabel, setSocialCustomLabel] = useState('');
  const [socialUrl, setSocialUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── File uploads ── */
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !accessToken) return;
    setIsUploading(true);
    setUploadError('');

    try {
      const data = new FormData();
      Array.from(files).forEach((f) => data.append('files', f));

      const res = await fetch('/api/annonces/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: data,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Erreur lors du téléversement.');

      const uploadedFiles: Attachment[] = json.data || [];
      setForm((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...uploadedFiles],
      }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur de téléversement.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  /* ── Social links ── */
  const addSocialLink = () => {
    const url = socialUrl.trim();
    if (!url) return;
    const label = socialPreset === 'Autre' ? (socialCustomLabel.trim() || 'Lien') : socialPreset;

    setForm((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { label, url }],
    }));
    setSocialUrl('');
    setSocialCustomLabel('');
  };

  const removeSocialLink = (index: number) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  };

  /* ── Save ── */
  const save = async (status: 'draft' | 'published') => {
    if (!accessToken) return;
    setIsSaving(true);
    setError('');
    try {
      const payloadData = {
        title: form.title,
        excerpt: form.excerpt,
        category: form.category,
        attachments: form.attachments,
        socialLinks: form.socialLinks,
        status,
      };

      const body = editingId
        ? { id: editingId, publication: payloadData }
        : payloadData;

      const res = await fetch('/api/news', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Impossible d\'enregistrer.');
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.');
    } finally {
      setIsSaving(false);
    }
  };

  const style = catStyle(form.category);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 md:items-center"
      role="dialog" aria-modal="true" aria-labelledby="composer-heading">
      <div className="my-8 grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl md:my-0 md:grid-cols-2">

        {/* ── Form side ── */}
        <div className="max-h-[90vh] overflow-y-auto p-6 md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                {editingId ? 'Modification' : 'Nouvelle annonce'}
              </p>
              <h2 id="composer-heading" className="mt-1 text-2xl font-black text-slate-900">
                {editingId ? 'Modifier l\'annonce' : 'Rédiger une annonce'}
              </h2>
            </div>
            <button onClick={onClose} aria-label="Fermer"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X size={18} />
            </button>
          </div>

          {/* Title */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Titre *</span>
            <input
              required maxLength={120}
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Ex. Publication des résultats du concours 2025"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <span className="mt-1 block text-right text-xs text-slate-400">{form.title.length}/120</span>
          </label>

          {/* Category */}
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Catégorie</span>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>

          {/* Body */}
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Texte de l&apos;annonce *</span>
            <textarea
              required maxLength={5000} rows={7}
              value={form.excerpt}
              onChange={e => setForm({ ...form, excerpt: e.target.value })}
              placeholder="Rédigez ici le contenu complet de l'annonce : informations, dates, lieu, modalités de participation…"
              className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-7 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <span className="mt-1 block text-right text-xs text-slate-400">{form.excerpt.length}/5000</span>
          </label>

          {/* ── Attachments Section ── */}
          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                <Paperclip size={15} className="text-blue-600" />
                Pièces jointes ({form.attachments.length})
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={e => void handleFiles(e.target.files)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.zip"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
              >
                {isUploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
                {isUploading ? 'Téléversement…' : 'Ajouter un fichier'}
              </button>
            </div>

            {uploadError && (
              <p className="mt-2 text-xs text-red-600">{uploadError}</p>
            )}

            {/* List of uploaded files */}
            {form.attachments.length > 0 ? (
              <div className="mt-3 space-y-2">
                {form.attachments.map((file, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={15} className="shrink-0 text-blue-600" />
                      <span className="truncate font-medium text-slate-800">{file.name}</span>
                      {file.size ? <span className="text-slate-400">({formatFileSize(file.size)})</span> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="ml-2 rounded-lg p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Supprimer la pièce jointe"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400 italic">
                Formats acceptés : PDF, Word, Excel, Images, ZIP (15 Mo max par fichier).
              </p>
            )}
          </div>

          {/* ── Social Links Section ── */}
          <div className="mt-6 border-t border-slate-200 pt-5">
            <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <Globe size={15} className="text-blue-600" />
              Retrouver la publication ailleurs (réseaux sociaux)
            </span>
            <p className="mt-1 text-xs text-slate-400">
              Ajoutez des liens vers vos publications Instagram, Facebook, LinkedIn, X…
            </p>

            {/* Add row */}
            <div className="mt-3 flex flex-wrap gap-2">
              <select
                value={socialPreset}
                onChange={e => setSocialPreset(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              >
                {SOCIAL_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                <option value="Autre">Autre réseau / site</option>
              </select>

              {socialPreset === 'Autre' && (
                <input
                  type="text"
                  placeholder="Nom du réseau"
                  value={socialCustomLabel}
                  onChange={e => setSocialCustomLabel(e.target.value)}
                  className="w-28 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              )}

              <input
                type="url"
                placeholder="https://..."
                value={socialUrl}
                onChange={e => setSocialUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSocialLink(); } }}
                className="flex-1 min-w-[150px] rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />

              <button
                type="button"
                onClick={addSocialLink}
                disabled={!socialUrl.trim()}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 disabled:opacity-40"
              >
                <Plus size={13} /> Ajouter
              </button>
            </div>

            {/* List of social links */}
            {form.socialLinks.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.socialLinks.map((s, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                  >
                    {renderSocialIcon(s.label)}
                    <span className="font-semibold">{s.label}:</span>
                    <span className="max-w-[130px] truncate text-slate-500">{s.url}</span>
                    <button
                      type="button"
                      onClick={() => removeSocialLink(i)}
                      className="ml-1 text-slate-400 hover:text-red-600"
                      title="Supprimer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />{error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5">
            <button onClick={() => void save('draft')} disabled={isSaving || !form.title || !form.excerpt}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40">
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <FileEdit size={15} />}
              Enregistrer brouillon
            </button>
            <button onClick={() => void save('published')} disabled={isSaving || !form.title || !form.excerpt}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-40">
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
              Publier l&apos;annonce
            </button>
          </div>
        </div>

        {/* ── Live preview side ── */}
        <div className="max-h-[90vh] overflow-y-auto border-t border-slate-200 bg-slate-50 p-6 md:border-l md:border-t-0 md:p-8">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Aperçu public en temps réel</p>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className={`h-1.5 ${style.bar}`} />
            <div className="p-5">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${style.bg} ${style.text}`}>
                <Tag size={10} />{form.category}
              </span>
              <h3 className="mt-4 text-xl font-black text-slate-900">
                {form.title || <span className="italic text-slate-300">Titre de l&apos;annonce</span>}
              </h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {form.excerpt || <span className="italic text-slate-300">Le texte de votre annonce apparaîtra ici.</span>}
              </p>

              {/* Attachments preview */}
              {form.attachments.length > 0 && (
                <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-700">Pièces jointes téléchargeables :</p>
                  <div className="mt-2 space-y-1.5">
                    {form.attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-blue-600">
                        <FileText size={13} />
                        <span className="underline truncate">{file.name}</span>
                        {file.size ? <span className="text-[10px] text-slate-400">({formatFileSize(file.size)})</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social links preview */}
              {form.socialLinks.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-semibold text-slate-400">Disponible sur :</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {form.socialLinks.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                        {renderSocialIcon(s.label)}
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-400">
            Cet aperçu reflète fidèlement la carte que verront les étudiants et le public sur la page <strong>/annonces</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── main page ── */
export default function GestionAnnoncesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [globalMsg, setGlobalMsg] = useState('');
  const [globalOk, setGlobalOk] = useState(false);

  // Composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<PublicationForm>(EMPTY_FORM);

  // Delete state
  const [deletingPub, setDeletingPub] = useState<Publication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // supabase may be null (missing env vars); use ReturnType on the non-null createClient return
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null);

  /* ── Load publications ── */
  const load = useCallback(async (token: string, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/news?manage=1', {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Impossible de charger.');
      setPublications(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      if (!silent) {
        setGlobalOk(false);
        setGlobalMsg(err instanceof Error ? err.message : 'Erreur de chargement.');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  /* ── Auth check + Realtime ── */
  useEffect(() => {
    let active = true;
    const verify = async () => {
      if (!supabase) { router.replace('/candidat'); return; }
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) { router.replace('/candidat'); return; }

      const res = await fetch('/api/news?manage=1', {
        headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store',
      });
      const result = await res.json().catch(() => ({}));
      if (!active) return;

      if (res.status === 401) { router.replace('/candidat'); return; }
      if (res.status === 403) {
        setCheckingRole(false);
        setGlobalMsg(result.error || 'Accès réservé aux administrateurs.');
        return;
      }
      setAccessToken(session.access_token);
      setAuthorized(true);
      setCheckingRole(false);
      setPublications(Array.isArray(result.data) ? result.data : []);

      // Realtime subscription
      if (supabase && !channelRef.current) {
        channelRef.current = supabase
          .channel('admin-gestion')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'actualites' },
            () => void load(session.access_token, true))
          .subscribe();
      }
    };
    void verify();
    return () => {
      active = false;
      if (channelRef.current) { void supabase?.removeChannel(channelRef.current); channelRef.current = null; }
    };
  }, [router, load]);

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!deletingPub || !accessToken) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/news?id=${encodeURIComponent(deletingPub.id)}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const r = await res.json().catch(() => ({}));
        throw new Error(r.error || 'Impossible de supprimer.');
      }
      setGlobalOk(true);
      setGlobalMsg(`« ${deletingPub.title} » supprimée.`);
      setDeletingPub(null);
      await load(accessToken);
    } catch (err) {
      setGlobalOk(false);
      setGlobalMsg(err instanceof Error ? err.message : 'Erreur de suppression.');
      setDeletingPub(null);
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── Computed stats ── */
  const published = publications.filter(p => p.publishedAt).length;
  const drafts = publications.length - published;

  /* ── Loading / unauthorized screens ── */
  if (checkingRole) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          Vérification de votre accès…
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-[60vh] bg-slate-50 px-4 py-20">
        <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="inline-block rounded-2xl bg-blue-50 p-4 text-blue-600"><Megaphone size={28} /></span>
          <h1 className="mt-4 text-xl font-black text-slate-900">Accès restreint</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {globalMsg || 'Connectez-vous avec un compte administrateur pour accéder à cet espace.'}
          </p>
          <button onClick={() => router.push('/candidat')}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700">
            Se connecter
          </button>
        </section>
      </main>
    );
  }

  return (
    <>
      {/* ── Delete confirm overlay ── */}
      {deletingPub && (
        <DeleteConfirm
          title={deletingPub.title}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeletingPub(null)}
          loading={isDeleting}
        />
      )}

      {/* ── Composer modal ── */}
      {composerOpen && (
        <Composer
          editingId={editingId}
          initialForm={editingForm}
          accessToken={accessToken}
          onClose={() => setComposerOpen(false)}
          onSaved={() => {
            setGlobalOk(true);
            setGlobalMsg(editingId ? 'Annonce mise à jour.' : 'Annonce créée.');
            void load(accessToken);
          }}
        />
      )}

      <main className="min-h-screen bg-slate-50">
        {/* ── Top header ── */}
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-5 md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link href="/annonces"
                  className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100">
                  <ArrowLeft size={16} />
                </Link>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">INPTIC · Administration</p>
                  <h1 className="text-2xl font-black text-slate-900">Gestion des annonces</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => void load(accessToken)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                  <RefreshCw size={14} />Actualiser
                </button>
                <button onClick={() => { setEditingId(null); setEditingForm(EMPTY_FORM); setComposerOpen(true); }}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700">
                  <Plus size={16} />Nouvelle annonce
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          {/* ── Stats bar ── */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            {[
              { label: 'Total', value: publications.length, color: 'text-slate-700', bg: 'bg-white' },
              { label: 'Publiées', value: published, color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'Brouillons', value: drafts, color: 'text-amber-700', bg: 'bg-amber-50' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border border-slate-200 ${s.bg} px-5 py-4 shadow-sm`}>
                <p className="text-xs font-semibold text-slate-400">{s.label}</p>
                <p className={`mt-1 text-3xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Global message ── */}
          {globalMsg && (
            <div className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${
              globalOk
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}>
              {globalOk ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> : <AlertCircle size={17} className="mt-0.5 shrink-0" />}
              <p className="font-medium">{globalMsg}</p>
              <button onClick={() => setGlobalMsg('')} className="ml-auto shrink-0 opacity-60 hover:opacity-100"><X size={15} /></button>
            </div>
          )}

          {/* ── List ── */}
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="mb-3 h-4 w-32 rounded-full bg-slate-200" />
                  <div className="h-6 w-2/3 rounded-lg bg-slate-200" />
                  <div className="mt-3 space-y-2">
                    <div className="h-3.5 w-full rounded bg-slate-100" />
                    <div className="h-3.5 w-5/6 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : publications.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-20 text-center">
              <span className="rounded-2xl bg-blue-50 p-4 text-blue-400"><Megaphone size={32} /></span>
              <p className="text-lg font-bold text-slate-700">Aucune annonce pour l&apos;instant</p>
              <p className="text-sm text-slate-400">Cliquez sur « Nouvelle annonce » pour commencer.</p>
              <button onClick={() => { setEditingId(null); setEditingForm(EMPTY_FORM); setComposerOpen(true); }}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
                <Plus size={15} />Créer la première annonce
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {publications.map(pub => (
                <PublicationCard
                  key={pub.id}
                  pub={pub}
                  token={accessToken}
                  onEdit={() => {
                    setEditingId(pub.id);
                    setEditingForm({
                      title: pub.title,
                      excerpt: pub.excerpt,
                      category: pub.category,
                      attachments: Array.isArray(pub.attachments) ? pub.attachments : [],
                      socialLinks: Array.isArray(pub.socialLinks) ? pub.socialLinks : [],
                    });
                    setComposerOpen(true);
                  }}
                  onDelete={() => setDeletingPub(pub)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
