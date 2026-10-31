'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  AlertCircle, Calendar, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download,
  ExternalLink, Eye, Facebook, FileText, Megaphone, X, ZoomIn,
  Pencil, Plus, ShieldCheck, Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth-client';
import ArticleEngagement from '@/components/ArticleEngagement';
import {
  Composer,
  DeleteConfirm,
  EMPTY_FORM,
  type PublicationForm,
} from './gestion/AnnoncesGestionClient';
import { canAccessStaffService } from '@/lib/roles';

/* ─────────────────────────────────── types ── */
type Attachment = {
  name: string;
  url: string;
  size?: number;
  type?: string;
};

type AnnouncementPhoto = {
  name: string;
  url: string;
};

type SocialLink = {
  label: string;
  url: string;
};

type Annonce = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  attachments?: Attachment[];
  socialLinks?: SocialLink[];
  coverImage?: string;
  publishedAt: string | null;
  createdAt: string | null;
};

/* ─────────────────────────────── constants ── */
const POLL_MS = 30_000;

/* ──────────────────────────────── helpers ── */
function formatDate(value: string | null, locale = 'fr') {
  if (!value) return null;
  const l = locale === 'en' ? 'en-GB' : locale === 'ar' ? 'ar' : locale === 'zh' ? 'zh-CN' : 'fr-FR';
  return new Date(value).toLocaleDateString(l, {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
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

function parsePayload(payload: unknown): Annonce[] {
  const raw: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] })?.data)
      ? (payload as { data: unknown[] }).data
      : [];

  const mapped: (Annonce | null)[] = raw.map((entry) => {
    const e = entry as Record<string, unknown>;
    const a = (e.attributes && typeof e.attributes === 'object')
      ? (e.attributes as Record<string, unknown>) : e;
    const id = String(e.documentId ?? e.id ?? '');
    if (!id) return null;
    return {
      id,
      title: String(a.title ?? a.titre ?? ''),
      slug: String(a.slug ?? id),
      excerpt: String(a.excerpt ?? a.description ?? a.resume ?? ''),
      category: String(a.category ?? 'Annonce'),
      attachments: (Array.isArray(a.attachments) ? a.attachments : []) as Attachment[],
      socialLinks: (Array.isArray(a.social_links)
        ? a.social_links
        : Array.isArray(a.socialLinks)
          ? a.socialLinks
          : []) as SocialLink[],
      coverImage: typeof (a.cover_image ?? a.coverImage) === 'string'
        ? String(a.cover_image ?? a.coverImage)
        : undefined,
      publishedAt: typeof a.publishedAt === 'string' ? a.publishedAt
        : typeof a.published_at === 'string' ? a.published_at : null,
      createdAt: typeof a.createdAt === 'string' ? a.createdAt
        : typeof a.created_at === 'string' ? a.created_at : null,
    } satisfies Annonce;
  });

  return mapped.filter((a): a is Annonce => a !== null && Boolean(a.title));
}

function getCoverImage(annonce: Annonce) {
  const coverLine = annonce.excerpt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^Image de couverture\s*:/i.test(line));
  const candidate = annonce.coverImage || coverLine?.replace(/^Image de couverture\s*:\s*/i, '') ||
    annonce.attachments?.find((attachment) =>
      attachment.type?.startsWith('image/') ||
      /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(attachment.url),
    )?.url;
  if (!candidate) return undefined;

  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : undefined;
  }
}

function isImageAttachment(attachment: Attachment) {
  return Boolean(
    attachment.type?.startsWith('image/') ||
    /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(attachment.url),
  );
}

function getAnnouncementSummary(excerpt: string) {
  const lines = excerpt.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const summaryIndex = lines.findIndex((line) => /^Résumé\s*:/i.test(line));
  if (summaryIndex >= 0) {
    const summaryLines: string[] = [];
    for (const line of lines.slice(summaryIndex)) {
      if (/^(?:Source officielle|Image de couverture)\s*:/i.test(line) || /^#/.test(line)) break;
      summaryLines.push(line.replace(/^Résumé\s*:\s*/i, '').trim());
    }
    if (summaryLines.length > 0) return summaryLines.join(' ');
  }

  return lines
    .filter((line) => !/^(?:Source officielle|Image de couverture)\s*:/i.test(line))
    .join('\n');
}

/* ───────────────────────── AnnonceCard component ── */
function AnnonceCard({
  annonce,
  isAdmin,
  onEdit,
  onDelete,
}: {
  annonce: Annonce;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const date = formatDate(annonce.publishedAt ?? annonce.createdAt, i18n.language);

  const summary = getAnnouncementSummary(annonce.excerpt);
  const paragraphs = summary.split(/\n{2,}/);
  const previewText = paragraphs[0] ?? '';
  const hasMore = paragraphs.length > 1 || summary.length > 160;
  const coverImage = getCoverImage(annonce);
  const photos = [
    ...(coverImage ? [{ name: annonce.title, url: coverImage }] : []),
    ...(annonce.attachments ?? [])
      .filter(isImageAttachment)
      .map((attachment) => ({ name: attachment.name, url: attachment.url })),
  ].filter((photo, index, list) => list.findIndex((item) => item.url === photo.url) === index);

  const hasAttachments = Boolean(annonce.attachments && annonce.attachments.length > 0);
  const hasSocials = Boolean(annonce.socialLinks && annonce.socialLinks.length > 0);
  const visiblePhotos = photos.slice(0, 4);
  const remainingPhotos = photos.length - visiblePhotos.length;

  useEffect(() => {
    if (selectedPhotoIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedPhotoIndex(null);
      if (event.key === 'ArrowLeft') setSelectedPhotoIndex((index) => index === null ? null : Math.max(0, index - 1));
      if (event.key === 'ArrowRight') setSelectedPhotoIndex((index) => index === null ? null : Math.min(photos.length - 1, index + 1));
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [photos.length, selectedPhotoIndex]);

  const categoryLabel = t(`annonces.categories.${annonce.category}`, annonce.category);

  return (
    <article
      id={annonce.slug}
      className="group flex min-w-0 scroll-mt-28 flex-col overflow-hidden !rounded-2xl border border-blue-100 bg-white shadow-[0_8px_24px_rgba(15,55,120,0.08)] transition hover:border-blue-300 hover:shadow-lg"
    >
      <div className="relative overflow-hidden !rounded-t-2xl bg-gradient-to-br from-white via-white to-blue-50 px-4 pb-3 pt-4 sm:px-5">
        <div className="pointer-events-none absolute -right-7 -top-14 h-28 w-28 rotate-45 border-l-[10px] border-yellow-400" aria-hidden="true" />
        <span className="relative inline-flex items-center gap-1.5 !rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold text-white">
          <Megaphone size={12} aria-hidden="true" />
          {categoryLabel}
        </span>
        <h2 className="relative mt-2 text-xl font-black uppercase leading-[1.05] tracking-tight text-blue-950 sm:text-2xl">
          {annonce.title}
        </h2>

        {/* ── Meta row ── */}
        <div className="relative mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] font-medium text-blue-950">
          {date && (
            <span className="flex items-center gap-1.5">
              <Calendar size={13} aria-hidden="true" />
              {date}
            </span>
          )}
          {hasAttachments && (
            <span className="flex items-center gap-1.5 border-l border-blue-200 pl-3">
              <FileText size={13} aria-hidden="true" />
              {annonce.attachments!.length} {t('annonces.downloadDocuments')}
            </span>
          )}
        </div>
        <div className="mt-2 h-0.5 w-10 bg-yellow-400" aria-hidden="true" />
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 sm:px-5">
        {coverImage ? (
          <button
            type="button"
            onClick={() => setSelectedPhotoIndex(photos.findIndex((photo) => photo.url === coverImage))}
            className="group/photo relative mt-1 block aspect-[16/9] w-full overflow-hidden !rounded-xl bg-slate-100 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            aria-label={`Ouvrir et télécharger la photo : ${annonce.title}`}
          >
            <img src={coverImage} alt={annonce.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover/photo:scale-[1.02]" />
            <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center !rounded-full bg-slate-950/70 text-white">
              <ZoomIn size={16} aria-hidden="true" />
            </span>
          </button>
        ) : (
          <div className="mt-1 grid aspect-[16/9] place-items-center !rounded-xl bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100 text-blue-800">
            <Megaphone size={34} aria-hidden="true" />
          </div>
        )}

        {/* ── Excerpt / Full text ── */}
        <div className="mt-3 flex-1 text-xs leading-5 text-blue-950">
          {expanded ? (
            <p className="whitespace-pre-wrap">{summary}</p>
          ) : (
            <p className="whitespace-pre-wrap line-clamp-3">
              {previewText.length > 160 ? previewText.slice(0, 160) + '…' : previewText}
              {!hasMore && paragraphs.length > 1 && '…'}
            </p>
          )}
        </div>

        {/* ── Expand / Collapse button ── */}
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 inline-flex items-center gap-1.5 self-center !rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-[10px] font-bold text-blue-800 transition hover:bg-blue-100"
          >
            {expanded ? (
              <><ChevronUp size={13} />{t('annonces.readLess')}</>
            ) : (
              <><ChevronDown size={13} />{t('annonces.readMore')}</>
            )}
          </button>
        )}

        {photos.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {visiblePhotos.map((photo, index) => (
              <button
                key={`${photo.url}-${index}`}
                type="button"
                onClick={() => setSelectedPhotoIndex(index)}
                aria-label={`Ouvrir et télécharger la photo : ${photo.name}`}
                className="h-12 w-12 shrink-0 overflow-hidden !rounded-full border-2 border-white shadow-[0_1px_5px_rgba(15,23,42,0.35)] ring-1 ring-slate-200 transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <img src={photo.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </button>
            ))}
            {remainingPhotos > 0 && (
              <button
                type="button"
                onClick={() => setSelectedPhotoIndex(visiblePhotos.length)}
                className="grid h-12 w-12 shrink-0 place-items-center !rounded-full bg-blue-700 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                aria-label={`Afficher les ${remainingPhotos} autres photos`}
              >
                +{remainingPhotos}
              </button>
            )}
          </div>
        )}

        {/* ── Downloadable Attachments ── */}
        {hasAttachments && (
          <div className="relative mt-4 self-center">
            <button
              type="button"
              onClick={() => setDocumentsOpen((open) => !open)}
              aria-expanded={documentsOpen}
              className="inline-flex items-center gap-2 !rounded-full bg-blue-700 px-5 py-2 text-[10px] font-bold text-white shadow-md transition hover:bg-blue-800"
            >
              <Download size={14} aria-hidden="true" />
              {t('annonces.downloadDocuments')} ({annonce.attachments!.length})
              <ChevronDown size={13} aria-hidden="true" />
            </button>
            {documentsOpen && (
              <div className="absolute bottom-[calc(100%+0.5rem)] left-1/2 z-20 max-h-56 w-[min(20rem,calc(100vw-3rem))] -translate-x-1/2 overflow-y-auto !rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                {annonce.attachments!.map((file, index) => (
                  <a
                    key={`${file.url}-${index}`}
                    href={file.url}
                    download={file.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 !rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 transition hover:bg-blue-50"
                  >
                    {isImageAttachment(file) ? <Eye size={14} className="shrink-0 text-blue-600" /> : <FileText size={14} className="shrink-0 text-blue-600" />}
                    <span className="min-w-0 flex-1 truncate font-semibold">{file.name}</span>
                    <span className="shrink-0 text-[10px] text-slate-400">{formatFileSize(file.size)}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Social Profiles / External Publications ── */}
        {hasSocials && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <span className="text-xs font-bold text-slate-500">
              {t('annonces.findPublication')}
            </span>
            {annonce.socialLinks!.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
              >
                {renderSocialIcon(s.label)}
                <span>{s.label}</span>
                <ExternalLink size={10} className="text-slate-400" />
              </a>
            ))}
          </div>
        )}

        {isAdmin && (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:border-blue-400 hover:bg-blue-100 shadow-2xs"
              >
                <Pencil size={12} />
                Modifier
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:border-red-400 hover:bg-red-100 shadow-2xs"
              >
                <Trash2 size={12} />
                Supprimer
              </button>
          </div>
        )}

        <ArticleEngagement
          articleSlug={`annonce-${annonce.slug}`}
          title={annonce.title}
          sharePath={`/annonces#${encodeURIComponent(annonce.slug)}`}
          showViews
        />
      </div>
      {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && createPortal(
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/85 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedPhotoIndex(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`Photo : ${photos[selectedPhotoIndex].name}`}
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col !rounded-2xl bg-white p-3 shadow-2xl sm:p-5"
          >
            <button
              type="button"
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center !rounded-full bg-slate-950/70 text-white transition hover:bg-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              aria-label="Fermer la photo"
            >
              <X size={20} aria-hidden="true" />
            </button>
            <div className="relative grid min-h-0 flex-1 place-items-center overflow-hidden !rounded-xl bg-slate-100">
              <img
                src={photos[selectedPhotoIndex].url}
                alt={photos[selectedPhotoIndex].name}
                className="max-h-[calc(92vh-7rem)] max-w-full object-contain"
              />
              {selectedPhotoIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedPhotoIndex((index) => index === null ? null : index - 1)}
                  className="absolute left-5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-slate-950/70 text-white transition hover:bg-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  aria-label="Photo précédente"
                >
                  <ChevronLeft size={22} />
                </button>
              )}
              {selectedPhotoIndex < photos.length - 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedPhotoIndex((index) => index === null ? null : index + 1)}
                  className="absolute right-5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-slate-950/70 text-white transition hover:bg-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  aria-label="Photo suivante"
                >
                  <ChevronRight size={22} />
                </button>
              )}
            </div>
            <nav className="mt-3 flex flex-wrap items-center justify-center gap-2" aria-label="Navigation dans les photos">
              {photos.map((photo, index) => (
                <button
                  key={`${photo.url}-page-${index}`}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(index)}
                  aria-label={`Afficher la photo ${index + 1} sur ${photos.length}`}
                  aria-current={selectedPhotoIndex === index ? 'true' : undefined}
                  className={`h-2.5 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    selectedPhotoIndex === index ? 'w-7 bg-blue-700' : 'w-2.5 bg-slate-300 hover:bg-blue-400'
                  }`}
                />
              ))}
            </nav>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-semibold text-slate-800">{photos[selectedPhotoIndex].name}</p>
              <a
                href={photos[selectedPhotoIndex].url}
                download={photos[selectedPhotoIndex].name}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 !rounded-full bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-800"
              >
                <Download size={15} aria-hidden="true" />
                Télécharger la photo
              </a>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </article>
  );
}

/* ────────────────────────── Page component ── */
export default function AnnoncesPublicPage() {
  const { t } = useTranslation();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [search, setSearch] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<PublicationForm>(EMPTY_FORM);
  const [deletingAnnonce, setDeletingAnnonce] = useState<Annonce | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  /* ── Load ── */
  const fetchAnnonces = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch('/api/news?target=annonces', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const list = parsePayload(data);
      setAnnonces(list);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    // Detect admin / staff user
    const checkAdmin = async () => {
      const { data } = await authClient.auth.getSession();
      const session = data.session;
      const sessionToken = session?.access_token || '';
      const sessionEmail = session?.user?.email || '';
      const rawRole = session?.user?.app_metadata?.role;
      const role = typeof rawRole === 'string' ? rawRole : '';
      const assignedService = session?.user?.user_metadata?.service ?? session?.user?.user_metadata?.department;

      if (active && session && canAccessStaffService(role, 'announcements', assignedService)) {
        setIsAdmin(true);
        setAdminEmail(sessionEmail);
        if (sessionToken) setAccessToken(sessionToken);
      }
    };
    void checkAdmin();

    void fetchAnnonces(false);

    pollRef.current = setInterval(() => void fetchAnnonces(true), POLL_MS);

    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchAnnonces]);

  /* ── Delete handler ── */
  const confirmDelete = async () => {
    if (!deletingAnnonce) return;
    if (!accessToken) {
      setFeedback({ msg: 'Session requise. Veuillez vous reconnecter sur la page de connexion.', ok: false });
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/news?id=${encodeURIComponent(deletingAnnonce.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Erreur lors de la suppression.');
      setFeedback({ msg: `« ${deletingAnnonce.title} » a été supprimée avec succès.`, ok: true });
      setDeletingAnnonce(null);
      await fetchAnnonces(true);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ msg: err instanceof Error ? err.message : 'Erreur de suppression.', ok: false });
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── Filter : Sortie du flux général de /annonces (Bloc A2) ── */
  const categories = ['Toutes', ...Array.from(new Set(annonces.map((a) => a.category))).filter((c) => c !== 'Concours')];

  const filtered = annonces.filter((a) => {
    // Si 'Toutes', on sort les concours du flux général des annonces
    const matchCat =
      selectedCategory === 'Toutes'
        ? a.category !== 'Concours'
        : a.category === selectedCategory;
    const matchSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ── Hero Banner ── */}
      <section className="relative isolate overflow-hidden text-white bg-slate-950">
        <img src="/banniere/1.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.88) 30%, rgba(15, 23, 42, 0.48) 50%, rgba(30, 136, 168, 0.16) 75%, rgba(30, 136, 168, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <img src="/logoinptic.png" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black md:text-6xl">
                {t('annonces.pageTitle')}
              </h1>
              <p className="mt-3 max-w-xl text-lg text-slate-200">
                {t('annonces.pageSubtitle')}
              </p>
            </div>

          </div>

          {/* ── Search & Categories ── */}
          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'Toutes' ? t('annonces.allCategories') : t(`annonces.categories.${cat}`, cat)}
                </button>
              ))}
            </div>

            {/* Search input */}
            <input
              type="search"
              placeholder={t('annonces.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 md:w-64"
            />
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="mx-auto max-w-screen-xl px-4 py-12 md:px-8 md:py-16">
        {feedback && (
          <div className={`mb-6 flex items-center gap-2 rounded-2xl p-4 text-sm font-semibold shadow-xs ${
            feedback.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {feedback.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.msg}</span>
          </div>
        )}

        {isAdmin && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-blue-600 p-2.5 text-white shadow-xs">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">Mode Admin</span>
                    <p className="text-sm font-bold text-slate-900">Administration des publications</p>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Connecté : <strong className="text-slate-700">{adminEmail}</strong>. Vous pouvez modifier ou supprimer les publications directement ci-dessous.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setEditingForm(EMPTY_FORM);
                    setComposerOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  <Plus size={14} />
                  Nouvelle annonce
                </button>
                <Link
                  href="/veille"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition"
                >
                  Espace Veille →
                </Link>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse overflow-hidden border border-slate-200 bg-white">
                <div className="aspect-[16/9] bg-slate-100" />
                <div className="p-4">
                  <div className="h-3 w-28 rounded-full bg-slate-200" />
                  <div className="mt-3 h-5 w-3/4 rounded-lg bg-slate-200" />
                  <div className="mt-3 space-y-2">
                    <div className="h-4 w-full rounded bg-slate-100" />
                    <div className="h-4 w-5/6 rounded bg-slate-100" />
                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Megaphone size={36} className="mx-auto text-slate-300" />
            <h3 className="mt-4 text-lg font-bold text-slate-700">{t('annonces.noAnnoncesTitle')}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {search
                ? t('annonces.noSearchResults', { query: search })
                : t('annonces.noAnnoncesDesc')}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-4 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                {t('annonces.clearSearch')}
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="mb-4 text-xs font-semibold text-slate-400">
              {filtered.length === 1
                ? t('annonces.publishedCount_one', { count: 1 })
                : t('annonces.publishedCount_other', { count: filtered.length })}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((annonce) => (
                <AnnonceCard
                  key={annonce.id}
                  annonce={annonce}
                  isAdmin={isAdmin}
                  onEdit={() => {
                    setEditingId(annonce.id);
                    setEditingForm({
                      title: annonce.title,
                      excerpt: annonce.excerpt,
                      category: annonce.category,
                      attachments: Array.isArray(annonce.attachments) ? annonce.attachments : [],
                      socialLinks: Array.isArray(annonce.socialLinks) ? annonce.socialLinks : [],
                    });
                    setComposerOpen(true);
                  }}
                  onDelete={() => setDeletingAnnonce(annonce)}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Admin Composer Modal ── */}
      {composerOpen && (
        <Composer
          editingId={editingId}
          initialForm={editingForm}
          accessToken={accessToken}
          onClose={() => setComposerOpen(false)}
          onSaved={() => {
            setFeedback({
              msg: editingId ? 'Annonce modifiée avec succès.' : 'Nouvelle annonce publiée avec succès.',
              ok: true,
            });
            void fetchAnnonces(true);
            setTimeout(() => setFeedback(null), 4000);
          }}
        />
      )}

      {/* ── Admin Delete Confirm Modal ── */}
      {deletingAnnonce && (
        <DeleteConfirm
          title={deletingAnnonce.title}
          loading={isDeleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeletingAnnonce(null)}
        />
      )}
    </main>
  );
}
