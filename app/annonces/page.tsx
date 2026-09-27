'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Calendar, ChevronDown, ChevronUp, Copy, Download, ExternalLink,
  Facebook, FileText, Megaphone, MessageCircle, Paperclip, Share2, Tag,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

/* ─────────────────────────────────── types ── */
type Attachment = {
  name: string;
  url: string;
  size?: number;
  type?: string;
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
  publishedAt: string | null;
  createdAt: string | null;
};

/* ─────────────────────────────── constants ── */
const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Annonce:          { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  'Événement':      { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  Concours:         { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  'Communiqué':     { bg: 'bg-emerald-50',text: 'text-emerald-700',dot: 'bg-emerald-500'},
  'Vie étudiante':  { bg: 'bg-pink-50',   text: 'text-pink-700',   dot: 'bg-pink-500'   },
};
const DEFAULT_COLOR = { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400' };
const POLL_MS = 30_000;

/* ──────────────────────────────── helpers ── */
function getColor(category: string) {
  return CATEGORY_COLORS[category] ?? DEFAULT_COLOR;
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('fr-FR', {
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
      publishedAt: typeof a.publishedAt === 'string' ? a.publishedAt
        : typeof a.published_at === 'string' ? a.published_at : null,
      createdAt: typeof a.createdAt === 'string' ? a.createdAt
        : typeof a.created_at === 'string' ? a.created_at : null,
    } satisfies Annonce;
  });

  return mapped.filter((a): a is Annonce => a !== null && Boolean(a.title));
}

function getShareUrl(slug: string) {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/annonces#${encodeURIComponent(slug)}`;
}

/* ───────────────────────── AnnonceCard component ── */
function AnnonceCard({ annonce }: { annonce: Annonce }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const color = getColor(annonce.category);
  const date = formatDate(annonce.publishedAt ?? annonce.createdAt);

  // Split: first paragraph as excerpt, rest as full body
  const paragraphs = annonce.excerpt.split(/\n{2,}/);
  const previewText = paragraphs[0] ?? '';
  const hasMore = annonce.excerpt.length > previewText.length || annonce.excerpt.length > 280;

  const shareUrl = getShareUrl(annonce.slug);
  const shareText = `${annonce.title} — ${shareUrl}`;

  const hasAttachments = Boolean(annonce.attachments && annonce.attachments.length > 0);
  const hasSocials = Boolean(annonce.socialLinks && annonce.socialLinks.length > 0);

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article
      id={annonce.slug}
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      {/* Colored top bar */}
      <div className={`h-1.5 w-full ${color.dot}`} />

      <div className="p-6 md:p-8">
        {/* ── Meta row ── */}
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${color.bg} ${color.text}`}>
            <Tag size={10} />
            {annonce.category}
          </span>
          {date && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar size={11} />
              {date}
            </span>
          )}
          {hasAttachments && (
            <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full">
              <Paperclip size={11} />
              {annonce.attachments!.length} document{annonce.attachments!.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── Title ── */}
        <h2 className="mt-4 text-2xl font-black leading-snug text-slate-900 md:text-3xl">
          {annonce.title}
        </h2>

        {/* ── Excerpt / Full text ── */}
        <div className="mt-4 text-sm leading-7 text-slate-600">
          {expanded ? (
            <p className="whitespace-pre-wrap">{annonce.excerpt}</p>
          ) : (
            <p className="whitespace-pre-wrap">
              {previewText.length > 280 ? previewText.slice(0, 280) + '…' : previewText}
              {!hasMore && paragraphs.length > 1 && '…'}
            </p>
          )}
        </div>

        {/* ── Expand / Collapse button ── */}
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${color.bg} ${color.text} hover:opacity-80`}
          >
            {expanded ? (
              <><ChevronUp size={13} />Réduire</>
            ) : (
              <><ChevronDown size={13} />Lire l&apos;annonce complète</>
            )}
          </button>
        )}

        {/* ── Downloadable Attachments ── */}
        {hasAttachments && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:p-5">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              <Paperclip size={13} className="text-blue-600" />
              Documents à télécharger ({annonce.attachments!.length})
            </h4>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {annonce.attachments!.map((file, i) => (
                <a
                  key={i}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs transition hover:border-blue-400 hover:shadow-md"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <FileText size={16} />
                    </span>
                    <div className="truncate">
                      <p className="truncate text-xs font-bold text-slate-800">{file.name}</p>
                      {file.size ? (
                        <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                      ) : null}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-100 p-2 text-slate-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    <Download size={14} />
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Social Profiles / External Publications ── */}
        {hasSocials && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <span className="text-xs font-bold text-slate-500">
              Retrouver cette publication :
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

        {/* ── Social sharing ── */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
          <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Share2 size={12} />
            Partager
          </span>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Partager sur WhatsApp"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-green-400 hover:bg-green-50 hover:text-green-700"
          >
            <MessageCircle size={13} />
            WhatsApp
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Partager sur Facebook"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
          >
            <Facebook size={13} />
            Facebook
          </a>

          {/* LinkedIn */}
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Partager sur LinkedIn"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            LinkedIn
          </a>

          {/* X / Twitter */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(annonce.title)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Partager sur X"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-800 hover:bg-slate-900 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.257 5.63 5.907-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117Z"/></svg>
            X
          </a>

          {/* Copy link */}
          <button
            type="button"
            onClick={() => void copyLink()}
            aria-label="Copier le lien"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
          >
            <Copy size={13} />
            {copied ? 'Copié !' : 'Copier le lien'}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ────────────────────────── Page component ── */
export default function AnnoncesPublicPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [search, setSearch] = useState('');
  const [liveUpdated, setLiveUpdated] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Load ── */
  const fetchAnnonces = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch('/api/news', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const list = parsePayload(data);
      setAnnonces(list);
      if (isSilent) {
        setLiveUpdated(true);
        setTimeout(() => setLiveUpdated(false), 3000);
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnnonces(false);

    // Supabase Realtime
    const sb = supabase;
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
    if (sb) {
      channel = sb
        .channel('annonces-page-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'actualites' },
          () => void fetchAnnonces(true)
        )
        .subscribe();
    }

    // Polling fallback
    pollRef.current = setInterval(() => void fetchAnnonces(true), POLL_MS);

    return () => {
      if (channel && sb) void sb.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchAnnonces]);

  /* ── Filter ── */
  const categories = ['Toutes', ...Array.from(new Set(annonces.map((a) => a.category)))];

  const filtered = annonces.filter((a) => {
    const matchCat = selectedCategory === 'Toutes' || a.category === selectedCategory;
    const matchSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ── Hero Banner ── */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700">
                <Megaphone size={13} />
                Communication officielle INPTIC
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
                Annonces & Communiqués
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600">
                Retrouvez toutes les annonces officielles, dates de concours, résultats,
                événements et informations de la vie étudiante de l&apos;INPTIC.
              </p>
            </div>

            {/* Live badge */}
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-600 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {liveUpdated ? 'Mis à jour à l’instant' : 'Flux en temps réel'}
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
                  {cat}
                </button>
              ))}
            </div>

            {/* Search input */}
            <input
              type="search"
              placeholder="Rechercher une annonce…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 md:w-64"
            />
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white p-8"
              >
                <div className="h-4 w-28 rounded-full bg-slate-200" />
                <div className="mt-4 h-8 w-3/4 rounded-lg bg-slate-200" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-full rounded bg-slate-100" />
                  <div className="h-4 w-5/6 rounded bg-slate-100" />
                  <div className="h-4 w-2/3 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Megaphone size={36} className="mx-auto text-slate-300" />
            <h3 className="mt-4 text-lg font-bold text-slate-700">Aucune annonce trouvée</h3>
            <p className="mt-1 text-sm text-slate-400">
              {search
                ? `Aucun résultat pour « ${search} ». Essayez un autre mot-clé.`
                : 'Les annonces publiées par l’administration apparaîtront ici.'}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-4 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs font-semibold text-slate-400">
              {filtered.length} annonce{filtered.length > 1 ? 's' : ''} publiée{filtered.length > 1 ? 's' : ''}
            </p>
            {filtered.map((annonce) => (
              <AnnonceCard key={annonce.id} annonce={annonce} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
