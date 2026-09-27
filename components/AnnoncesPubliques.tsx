'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Megaphone, Calendar, Tag, RefreshCw, Paperclip, Download,
  ExternalLink, FileText, Facebook,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

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

const POLL_INTERVAL_MS = 30_000;

export default function AnnoncesPubliques() {
  const { t, i18n } = useTranslation();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'done' | 'empty'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Fetch announcements from the public API */
  const loadAnnonces = useCallback(async (silent = false) => {
    if (!silent) setLoadStatus('loading');
    else setRefreshing(true);
    try {
      const res = await fetch('/api/news', { cache: 'no-store' });
      if (!res.ok) throw new Error('unavailable');
      const parsed = parsePayload(await res.json());
      setAnnonces(parsed);
      setLoadStatus(parsed.length === 0 ? 'empty' : 'done');
    } catch {
      if (!silent) setLoadStatus('empty');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAnnonces(false);

    const sb = supabase;
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
    if (sb) {
      channel = sb
        .channel('actualites-public')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'actualites',
            filter: 'status=eq.published',
          },
          () => {
            void loadAnnonces(true);
          }
        )
        .subscribe();
    }

    pollRef.current = setInterval(() => void loadAnnonces(true), POLL_INTERVAL_MS);

    return () => {
      if (channel && sb) void sb.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadAnnonces]);

  /* ── Loading skeleton ── */
  if (loadStatus === 'loading') {
    return (
      <div className="flex flex-col gap-4">
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
    <div className="flex flex-col gap-5">
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

        return (
          <article
            key={annonce.id}
            id={annonce.slug}
            className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            {/* Meta row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getCategoryColor(annonce.category)}`}
                >
                  <Tag size={11} />
                  {t(`annonces.categories.${annonce.category}`, annonce.category)}
                </span>
                {(annonce.publishedAt ?? annonce.createdAt) && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar size={11} />
                    {formatDate(annonce.publishedAt ?? annonce.createdAt, i18n.language)}
                  </span>
                )}
              </div>
              <Link
                href={`/annonces#${encodeURIComponent(annonce.slug)}`}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                {t('annonces.openOnAnnonces')}
              </Link>
            </div>

            {/* Title & Body */}
            <h3 className="mt-4 text-xl font-bold text-slate-900">{annonce.title}</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {annonce.excerpt}
            </p>

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
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
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
          </article>
        );
      })}
    </div>
  );
}
