'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Megaphone, Calendar, Tag, RefreshCw, Paperclip, Download,
  ExternalLink, FileText, Facebook, Share2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth-client';
import { canAccessStaffService } from '@/lib/roles';
import TranslatedText from '@/components/TranslatedText';

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
  coverImage?: string;
};

type PublicationDetails = {
  eyebrow: string | null;
  summary: string;
  sourceUrl: string | null;
  coverImage: string | null;
  tags: string[];
};

const CATEGORY_COLORS: Record<string, string> = {
  Annonce: 'bg-blue-100 text-blue-800',
  'Événement': 'bg-purple-100 text-purple-800',
  Concours: 'bg-amber-100 text-amber-800',
  'Communiqué': 'bg-emerald-100 text-emerald-800',
  'Vie étudiante': 'bg-pink-100 text-pink-800',
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? 'bg-slate-100 text-slate-700';
}

function formatDate(value: string | null, locale: string) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(
    locale === 'en' ? 'en-GB' : locale === 'ar' ? 'ar' : locale === 'zh' ? 'zh-CN' : 'fr-FR',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );
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
    const attrs =
      e.attributes && typeof e.attributes === 'object'
        ? (e.attributes as Record<string, unknown>)
        : e;
    const id = String(e.documentId ?? e.id ?? '');
    if (!id) return null;
    return {
      id,
      title: String(attrs.title ?? attrs.titre ?? ''),
      slug: String(attrs.slug ?? id),
      excerpt: String(attrs.excerpt ?? attrs.description ?? attrs.resume ?? ''),
      category: String(attrs.category ?? 'Annonce'),
      attachments: (Array.isArray(attrs.attachments) ? attrs.attachments : []) as Attachment[],
      socialLinks: (Array.isArray(attrs.social_links)
        ? attrs.social_links
        : Array.isArray(attrs.socialLinks)
          ? attrs.socialLinks
          : []) as SocialLink[],
      publishedAt:
        typeof attrs.publishedAt === 'string'
          ? attrs.publishedAt
          : typeof attrs.published_at === 'string'
            ? attrs.published_at
            : null,
      createdAt:
        typeof attrs.createdAt === 'string'
          ? attrs.createdAt
          : typeof attrs.created_at === 'string'
            ? attrs.created_at
            : null,
    } satisfies Annonce;
  });

  return mapped.filter((a): a is Annonce => a !== null && Boolean(a.title));
}

function safeHttpUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function parsePublicationDetails(excerpt: string, title: string): PublicationDetails {
  const lines = excerpt.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const eyebrow = lines.find((line) => /^\[[^\]]+\]$/.test(line))?.slice(1, -1) || null;
  const summaryIndex = lines.findIndex((line) => /^Résumé\s*:/i.test(line));
  let summary = '';
  if (summaryIndex >= 0) {
    const summaryLines: string[] = [];
    for (const line of lines.slice(summaryIndex)) {
      if (/^(Source officielle|Image de couverture)\s*:/i.test(line) || /^#/.test(line)) break;
      summaryLines.push(line.replace(/^Résumé\s*:\s*/i, '').trim());
    }
    summary = summaryLines.filter(Boolean).join(' ');
  }

  const sourceLine = lines.find((line) => /^Source officielle\s*:/i.test(line));
  const coverLine = lines.find((line) => /^Image de couverture\s*:/i.test(line));
  const tags = excerpt.match(/#[\p{L}\p{N}_-]+/gu) || [];
  const structured = Boolean(eyebrow || summaryIndex >= 0 || sourceLine || coverLine);
  const plainText = structured
    ? lines
        .filter((line) =>
          line.toLocaleLowerCase() !== title.trim().toLocaleLowerCase() &&
          !/^\[[^\]]+\]$/.test(line) &&
          !/^(Résumé|Source officielle|Image de couverture)\s*:/i.test(line) &&
          !/^#/.test(line)
        )
        .join('\n')
    : excerpt.trim();

  return {
    eyebrow,
    summary: summary || plainText,
    sourceUrl: safeHttpUrl(sourceLine?.replace(/^Source officielle\s*:\s*/i, '')),
    coverImage: safeHttpUrl(coverLine?.replace(/^Image de couverture\s*:\s*/i, '')),
    tags,
  };
}

function ArticleEngagement({ articleSlug, title }: { articleSlug: string; title: string }) {
  const [counts, setCounts] = useState({ likes: 0, shares: 0 });
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);
  const [shareOptionsOpen, setShareOptionsOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState('');

  useEffect(() => {
    let active = true;
    let refreshInProgress = false;

    const refreshStats = async () => {
      if (document.visibilityState !== 'visible' || refreshInProgress) return;
      refreshInProgress = true;
      try {
        const response = await fetch(`/api/news/engagement?articleSlug=${encodeURIComponent(articleSlug)}`, { cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json().catch(() => null);
        const data = payload?.data as { likes?: number; shares?: number; liked?: boolean } | undefined;
        if (!data || typeof data.liked !== 'boolean') return;
        if (active) {
          setCounts({ likes: Number(data.likes) || 0, shares: Number(data.shares) || 0 });
          setLiked(data.liked);
        }
      } catch {
        // Keep the latest confirmed counts when a refresh temporarily fails.
      } finally {
        refreshInProgress = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshStats();
    };

    void refreshStats();
    const interval = window.setInterval(() => void refreshStats(), 5000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [articleSlug]);

  async function track(action: 'like' | 'share', network?: string) {
    const response = await fetch('/api/news/engagement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleSlug, action, network }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setShareNotice(payload?.error || 'Interaction impossible pour le moment.');
      return false;
    }
    const data = payload?.data as { likes?: number; shares?: number; liked?: boolean } | undefined;
    if (!data || typeof data.liked !== 'boolean') {
      setShareNotice('La confirmation de l’interaction est invalide.');
      return false;
    }
    setCounts({
      likes: Number(data.likes) || 0,
      shares: Number(data.shares) || 0,
    });
    setLiked(data.liked);
    window.dispatchEvent(new CustomEvent('inptic:article-engagement-updated', { detail: { articleSlug, data } }));
    return true;
  }

  async function handleLike() {
    setPending(true);
    setShareNotice('');
    try {
      const confirmed = await track('like');
      if (!confirmed) setShareNotice((notice) => notice || 'Le like n’a pas été confirmé; le compteur reste inchangé.');
    } catch {
      setShareNotice('Le like n’a pas pu être enregistré; le compteur reste inchangé.');
    } finally {
      setPending(false);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/annonces#${encodeURIComponent(articleSlug)}`;
    if (typeof navigator.share !== 'function') {
      setShareOptionsOpen((open) => !open);
      setShareNotice('Choisissez un réseau pour enregistrer le partage.');
      return;
    }

    setShareOptionsOpen(false);
    setShareNotice('');
    try {
      await navigator.share({ title, url });
      await track('share');
      setShareNotice('Partage confirmé.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setShareNotice('Partage annulé; le compteur reste inchangé.');
        return;
      }
      setShareNotice('Le partage n’a pas été confirmé; le compteur reste inchangé.');
    }
  }

  function trackPlatformShare(network: string) {
    setShareOptionsOpen(false);
    void track('share', network);
  }

  const shareUrl = `${typeof window === 'undefined' ? '' : window.location.origin}/annonces#${encodeURIComponent(articleSlug)}`;
  const shareText = encodeURIComponent(`${title} ${shareUrl}`);

  async function copyForYouTube() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareNotice('Lien copié. Collez-le dans votre publication ou description YouTube.');
      void track('share', 'youtube');
      setShareOptionsOpen(false);
    } catch {
      setShareNotice('La copie du lien n’est pas disponible dans ce navigateur.');
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
      <button
        type="button"
        onClick={() => void handleLike()}
        disabled={pending}
        aria-pressed={liked}
        aria-label={`${liked ? 'Retirer le like' : 'Aimer'} : ${counts.likes} likes`}
        className={`inline-flex items-center gap-1.5 transition hover:text-rose-700 disabled:opacity-50 ${liked ? 'font-semibold text-rose-700' : ''}`}
      >
        <img
          src="/partages/like.svg"
          alt=""
          className="h-4 w-4"
          style={liked ? { filter: 'invert(24%) sepia(90%) saturate(1800%) hue-rotate(315deg)' } : undefined}
        />
        <span>{counts.likes} likes</span>
      </button>
      <div className="relative ml-auto w-full sm:w-auto">
        <button
          type="button"
          onClick={() => void handleShare()}
          aria-expanded={shareOptionsOpen}
          aria-controls={`share-options-${articleSlug}`}
          className="inline-flex min-h-8 items-center gap-1.5 border border-slate-200 px-2.5 text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800"
        >
          <Share2 size={14} aria-hidden="true" />
          <span className="text-xs font-semibold">Partager</span>
          <span className="text-[10px] text-slate-500">{counts.shares}</span>
        </button>
        {shareOptionsOpen && (
          <div id={`share-options-${articleSlug}`} role="group" aria-label="Choisir une plateforme de partage" className="share-platform-popover absolute bottom-[calc(100%+0.5rem)] right-0 z-50 flex w-max max-w-[calc(100vw-2rem)] items-center gap-1 border border-slate-200 bg-white p-2 shadow-xl">
            <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer" onClick={() => trackPlatformShare('whatsapp')} className="flex min-w-[58px] flex-col items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">
              <img src="/partages/whatsapp.svg" alt="" className="h-5 w-5" /> WhatsApp
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" onClick={() => trackPlatformShare('facebook')} className="flex min-w-[58px] flex-col items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-800">
              <img src="/partages/facebook.svg" alt="" className="h-5 w-5" /> Facebook
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" onClick={() => trackPlatformShare('linkedin')} className="flex min-w-[58px] flex-col items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-800">
              <img src="/partages/linkedin.svg" alt="" className="h-5 w-5" /> LinkedIn
            </a>
            <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" onClick={() => void copyForYouTube()} className="flex min-w-[58px] flex-col items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-red-50 hover:text-red-800">
              <img src="/partages/youtube.svg" alt="" className="h-5 w-5" /> YouTube
            </a>
            <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${shareText}`} onClick={() => trackPlatformShare('mail')} className="flex min-w-[58px] flex-col items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950">
              <img src="/partages/mail-send.svg" alt="" className="h-5 w-5" /> E-mail
            </a>
            <a href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" onClick={() => { void navigator.clipboard.writeText(shareUrl).catch(() => {}); void track('share', 'tiktok'); setShareOptionsOpen(false); }} className="flex min-w-[58px] flex-col items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-900 hover:text-white">
              <img src="/partages/tiktok.svg" alt="" className="h-5 w-5" /> TikTok
            </a>
          </div>
        )}
      </div>
      {shareNotice && <p role="status" className="basis-full text-[10px] leading-4 text-slate-400">{shareNotice}</p>}
    </div>
  );
}

const POLL_INTERVAL_MS = 30_000;

export default function AnnoncesPubliques() {
  const { t, i18n } = useTranslation();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'done' | 'empty'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coverLookups = useRef(new Set<string>());

  /** Fetch announcements from the public API */
  const loadAnnonces = useCallback(async (silent = false) => {
    if (!silent) setLoadStatus('loading');
    else setRefreshing(true);
    try {
      const res = await fetch('/api/news?target=actualites', { cache: 'no-store' });
      if (!res.ok) throw new Error('unavailable');
      const parsed = parsePayload(await res.json());
      setAnnonces((current) => {
        const existingCovers = new Map(current.filter((item) => item.coverImage).map((item) => [item.slug, item.coverImage!]));
        return parsed.map((item) => ({
          ...item,
          coverImage: item.coverImage || existingCovers.get(item.slug),
        }));
      });
      setLoadStatus(parsed.length === 0 ? 'empty' : 'done');
      const missingCoverSources = [...new Set(parsed.flatMap((item) => {
        if (item.coverImage || parsePublicationDetails(item.excerpt, item.title).coverImage) return [];
        const sourceUrl = item.socialLinks?.map((link) => safeHttpUrl(link.url)).find((value) => value && new URL(value).hostname.endsWith('dev.to'));
        return sourceUrl && !coverLookups.current.has(sourceUrl) ? [sourceUrl] : [];
      }))];
      missingCoverSources.forEach((sourceUrl) => coverLookups.current.add(sourceUrl));
      if (missingCoverSources.length > 0) {
        void Promise.all(missingCoverSources.map(async (sourceUrl) => {
          const response = await fetch(`/api/tech-veille?article=${encodeURIComponent(sourceUrl)}`, { cache: 'no-store' });
          if (!response.ok) throw new Error('Couverture non disponible.');
          const payload = await response.json();
          const coverImage = safeHttpUrl(payload.item?.coverImage);
          return coverImage ? { sourceUrl, coverImage } : null;
        }))
          .then((covers) => {
            const coverBySource = new Map(covers.filter((cover): cover is NonNullable<typeof cover> => cover !== null).map(({ sourceUrl, coverImage }) => [sourceUrl, coverImage]));
            setAnnonces((current) => current.map((item) => {
              if (item.coverImage || parsePublicationDetails(item.excerpt, item.title).coverImage) return item;
              const sourceUrl = item.socialLinks?.map((link) => safeHttpUrl(link.url)).find((value) => value && coverBySource.has(value));
              const coverImage = sourceUrl ? coverBySource.get(sourceUrl) : undefined;
              return coverImage ? { ...item, coverImage } : item;
            }));
          })
          .catch(() => missingCoverSources.forEach((sourceUrl) => coverLookups.current.delete(sourceUrl)));
      }
    } catch {
      if (!silent) setLoadStatus('empty');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAnnonces(false);

    // Check admin status
    void authClient.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (user) {
        const role = user.app_metadata?.role;
        const assignedService = user.user_metadata?.service ?? user.user_metadata?.department;
        setIsAdmin(canAccessStaffService(role, 'announcements', assignedService));
      }
    });

    pollRef.current = setInterval(() => void loadAnnonces(true), POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadAnnonces]);

  /* ── Loading skeleton ── */
  if (loadStatus === 'loading') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
            <div className="h-6 w-3/4 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-full rounded bg-slate-100" />
            <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
            <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  /* ── Empty state ── */
  if (loadStatus === 'empty') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <Megaphone className="text-slate-400" size={32} />
        <p className="font-semibold text-slate-600">{t('annonces.emptyState')}</p>
        <p className="text-sm text-slate-400">
          {t('annonces.emptyStateDesc')}
        </p>
      </div>
    );
  }

  /* ── Annonces list ── */
  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Live-refresh indicator */}
      {refreshing && (
        <p className="flex items-center gap-2 text-xs font-medium text-blue-600">
          <RefreshCw size={12} className="animate-spin" />
          {t('annonces.updatingRealtime')}
        </p>
      )}

      {annonces.map((annonce) => {
        const hasAttachments = Boolean(annonce.attachments && annonce.attachments.length > 0);
        const hasSocials = Boolean(annonce.socialLinks && annonce.socialLinks.length > 0);
        const publication = parsePublicationDetails(annonce.excerpt, annonce.title);
        const coverImage = annonce.coverImage || publication.coverImage;
        const sourceHost = publication.sourceUrl ? new URL(publication.sourceUrl).hostname.replace(/^www\./, '') : null;

        return (
          <article
            key={annonce.id}
            id={annonce.slug}
            className="scroll-mt-24 flex h-full flex-col overflow-visible border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="h-1.5 bg-gradient-to-r from-blue-800 via-cyan-600 to-emerald-500" />
            {coverImage && (
              <div className="relative aspect-[16/7] overflow-hidden bg-slate-900">
                <img src={coverImage} alt={annonce.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                <span className="absolute bottom-3 left-3 bg-slate-950/85 px-2.5 py-1 text-[9px] font-bold uppercase text-white sm:left-4">
                  {publication.eyebrow || annonce.category}
                </span>
              </div>
            )}
            <div className="flex flex-1 flex-col p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase ${getCategoryColor(annonce.category)}`}
                >
                  <Tag size={10} />
                  {t(`annonces.categories.${annonce.category}`, annonce.category)}
                </span>
                {(annonce.publishedAt ?? annonce.createdAt) && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Calendar size={11} className="text-slate-400" />
                    {formatDate(annonce.publishedAt ?? annonce.createdAt, i18n.language)}
                  </span>
                )}
              </div>
              <Link
                href={`/annonces#${encodeURIComponent(annonce.slug)}`}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 hover:text-blue-900"
              >
                Voir <ExternalLink size={11} aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-4">
              {publication.eyebrow && <p className="mb-1.5 truncate text-[10px] font-bold uppercase text-cyan-800">{publication.eyebrow}</p>}
              <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-950 sm:text-xl">
                <TranslatedText text={annonce.title} />
              </h3>
              {publication.summary && (
                <div className="mt-3 border-l-2 border-cyan-600 pl-3">
                  <p className="mb-1 text-[9px] font-bold uppercase text-slate-400">Résumé</p>
                  <p className="line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-slate-700">
                    <TranslatedText text={publication.summary} />
                  </p>
                </div>
              )}
            </div>

            {(publication.sourceUrl || publication.tags.length > 0) && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-y border-slate-100 py-3">
                {publication.sourceUrl && (
                  <a href={publication.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-blue-800 hover:text-blue-950">
                    <ExternalLink size={13} className="shrink-0" aria-hidden="true" />
                    <span>Source</span>
                    <span className="truncate text-[10px] font-normal text-slate-500">{sourceHost}</span>
                  </a>
                )}
                {publication.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {publication.tags.slice(0, 3).map((tag) => <span key={tag} className="text-[10px] font-medium text-slate-500">{tag}</span>)}
                  </div>
                )}
              </div>
            )}

            <ArticleEngagement articleSlug={annonce.slug} title={annonce.title} />

            {/* Attachments */}
            {hasAttachments && (
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="flex items-center gap-1 text-xs font-bold text-slate-600">
                  <Paperclip size={12} className="text-blue-600" />
                  {t('annonces.downloadDocuments')} :
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {annonce.attachments!.map((file, i) => (
                    <a
                      key={i}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-blue-400 hover:text-blue-600"
                    >
                      <FileText size={13} className="text-blue-500" />
                      <span className="max-w-[160px] truncate">{file.name}</span>
                      {file.size ? <span className="text-[10px] text-slate-400">({formatFileSize(file.size)})</span> : null}
                      <Download size={11} className="text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Social links */}
            {hasSocials && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400">{t('annonces.viewAlsoOn')}</span>
                {annonce.socialLinks!.map((s, i) => (
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
            </div>
          </article>
        );
      })}
    </div>
  );
}
