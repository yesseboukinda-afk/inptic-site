'use client';

import { useState } from 'react';
import { Facebook, Heart, Linkedin, Mail, MessageCircle, Share2 } from 'lucide-react';

type ArticleEngagementProps = {
  articleSlug: string;
  title: string;
  sharePath: string;
};

export default function ArticleEngagement({ articleSlug, title, sharePath }: ArticleEngagementProps) {
  const [counts, setCounts] = useState({ likes: 0, shares: 0 });
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);
  const [shareOptionsOpen, setShareOptionsOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState('');

  function getShareUrl() {
    return `${window.location.origin}${sharePath}`;
  }

  async function track(action: 'like' | 'share') {
    const response = await fetch('/api/news/engagement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleSlug, action }),
    });
    if (!response.ok) return false;

    const payload = await response.json().catch(() => null);
    const data = payload?.data as { likes?: number; shares?: number; liked?: boolean } | undefined;
    if (!data || typeof data.liked !== 'boolean' || !Number.isFinite(Number(data.likes)) || !Number.isFinite(Number(data.shares))) {
      return false;
    }

    setCounts({ likes: Number(data.likes) || 0, shares: Number(data.shares) || 0 });
    setLiked(data.liked);
    window.dispatchEvent(new Event('inptic:article-engagement-updated'));
    return true;
  }

  async function handleLike() {
    setPending(true);
    setShareNotice('');
    try {
      const confirmed = await track('like');
      if (!confirmed) setShareNotice('Le like n’a pas été confirmé; le compteur reste inchangé.');
    } catch {
      setShareNotice('Le like n’a pas pu être enregistré; le compteur reste inchangé.');
    } finally {
      setPending(false);
    }
  }

  async function shareWithDevice() {
    if (typeof navigator.share !== 'function') {
      setShareNotice('Le partage système n’est pas disponible sur cet appareil.');
      return;
    }

    try {
      await navigator.share({ title, url: getShareUrl() });
      const confirmed = await track('share');
      setShareNotice(confirmed ? 'Partage confirmé.' : 'Partage effectué, mais le compteur n’a pas reçu la confirmation serveur.');
      setShareOptionsOpen(false);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setShareNotice('Partage annulé; le compteur reste inchangé.');
        return;
      }
      setShareNotice('Le partage n’a pas été confirmé; le compteur reste inchangé.');
    }
  }

  async function copyForYouTube() {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setShareNotice('Lien copié. Collez-le dans votre publication ou description YouTube.');
      setShareOptionsOpen(false);
    } catch {
      setShareNotice('La copie du lien n’est pas disponible dans ce navigateur.');
    }
  }

  const shareUrl = typeof window === 'undefined' ? '' : getShareUrl();
  const shareText = encodeURIComponent(`${title} ${shareUrl}`);
  const stopCountingFallbackShare = () => setShareOptionsOpen(false);

  return (
    <section aria-label="Statistiques et partage de l’article" className="mt-4 border border-slate-200 bg-slate-50/70 p-3">
      <p className="mb-2 text-[9px] font-bold uppercase text-slate-400">Statistiques</p>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <button
          type="button"
          onClick={() => void handleLike()}
          disabled={pending}
          aria-pressed={liked}
          aria-label={`${liked ? 'Retirer le like' : 'Aimer'} : ${counts.likes} likes`}
          className={`inline-flex min-h-8 items-center gap-1.5 transition hover:text-rose-700 disabled:opacity-50 ${liked ? 'font-semibold text-rose-700' : ''}`}
        >
          <img
            src="/partages/like.svg"
            alt=""
            className="h-4 w-4"
            style={liked ? { filter: 'invert(24%) sepia(90%) saturate(1800%) hue-rotate(315deg)' } : undefined}
          />
          {counts.likes}
        </button>

        <div className="relative ml-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShareOptionsOpen((open) => !open)}
            aria-expanded={shareOptionsOpen}
            aria-controls={`share-options-${articleSlug}`}
            className="inline-flex min-h-8 items-center gap-1.5 border border-slate-200 bg-white px-2.5 text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800"
          >
            <Share2 size={14} aria-hidden="true" />
            <span className="text-xs font-semibold">Partager</span>
            <span className="text-[10px] text-slate-400">{counts.shares}</span>
          </button>
        {shareOptionsOpen && (
          <div
            id={`share-options-${articleSlug}`}
            role="group"
            aria-label="Choisir une plateforme de partage"
            className="share-platform-popover absolute bottom-[calc(100%+0.5rem)] right-0 z-50 flex w-max max-w-[calc(100vw-2rem)] items-center gap-1 overflow-x-auto border border-slate-200 bg-white p-2 shadow-xl"
          >
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button type="button" onClick={() => void shareWithDevice()} className="flex min-w-[58px] flex-col items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-800">
                <Share2 size={20} aria-hidden="true" /> Appareil
              </button>
            )}
            <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer" onClick={stopCountingFallbackShare} className="flex min-w-[58px] flex-col items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">
              <img src="/partages/whatsapp.svg" alt="" className="h-5 w-5" /> WhatsApp
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" onClick={stopCountingFallbackShare} className="flex min-w-[58px] flex-col items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-800">
              <img src="/partages/facebook.svg" alt="" className="h-5 w-5" /> Facebook
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" onClick={stopCountingFallbackShare} className="flex min-w-[58px] flex-col items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-800">
              <img src="/partages/linkedin.svg" alt="" className="h-5 w-5" /> LinkedIn
            </a>
            <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" onClick={() => void copyForYouTube()} className="flex min-w-[58px] flex-col items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-red-50 hover:text-red-800">
              <img src="/partages/youtube.svg" alt="" className="h-5 w-5" /> YouTube
            </a>
            <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${shareText}`} onClick={stopCountingFallbackShare} className="flex min-w-[58px] flex-col items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950">
              <img src="/partages/mail-send.svg" alt="" className="h-5 w-5" /> E-mail
            </a>
          </div>
        )}
        </div>
      </div>
      {shareNotice && <p role="status" className="mt-2 text-[10px] leading-4 text-slate-500">{shareNotice}</p>}
    </section>
  );
}
