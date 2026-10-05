'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Megaphone, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type CarouselAnnouncement = {
  id: string;
  tag: string;
  title: string;
  description: string;
  coverImage?: string;
  link: string;
  cta: string;
};

function getCoverImage(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const url = value.trim();
  return url.startsWith('/') || /^https?:\/\//i.test(url) ? url : undefined;
}

export default function AnnouncementsCarousel() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [publishedAnnouncements, setPublishedAnnouncements] = useState<CarouselAnnouncement[]>([]);
  const publishedSignature = useRef('');

  const defaultAnnouncements: CarouselAnnouncement[] = [
    {
      id: 'concours',
      tag: t('announcements.tagConcours', 'Concours 2026'),
      title: t('announcements.titleConcours', 'Dépôt des dossiers et paiement des frais de dossier en ligne ouverts'),
      description: t('announcements.descConcours', 'Déposez vos pièces justificatives, obtenez votre accusé de réception et réglez via Airtel/Moov Money.'),
      link: '/concours',
      cta: t('announcements.ctaConcours', 'Déposer mon dossier'),
    },
    {
      id: 'innovation',
      tag: t('announcements.tagEvent', 'Événement'),
      title: t('announcements.titleEvent', 'Semaine de l’Innovation Numérique & Hackathon INPTIC'),
      description: t('announcements.descEvent', 'Rejoignez les ateliers et conférences sur l’Intelligence Artificielle et la Cybersécurité.'),
      link: '/actualites',
      cta: t('announcements.ctaEvent', 'En savoir plus'),
    },
    {
      id: 'alumni',
      tag: t('announcements.tagAlumni', 'Espace Alumni & ANDG'),
      title: t('announcements.titleAlumni', 'Lancement de l’Annuaire National des Diplômés (ANDG)'),
      description: t('announcements.descAlumni', 'Diplômés de l’INPTIC, rejoignez le réseau professionnel officiel du Gabon.'),
      link: '/alumni',
      cta: t('announcements.ctaAlumni', 'Rejoindre le réseau'),
    },
  ];
  const announcements = [...publishedAnnouncements, ...defaultAnnouncements];

  useEffect(() => {
    let active = true;

    const loadPublishedAnnouncements = async () => {
      try {
        const response = await fetch('/api/news?target=annonces', { cache: 'no-store' });
        if (!response.ok) return;

        const payload = await response.json();
        const entries: unknown[] = Array.isArray(payload?.data) ? payload.data : [];
        const mapped = entries.flatMap((entry): CarouselAnnouncement[] => {
          if (!entry || typeof entry !== 'object') return [];
          const item = entry as Record<string, unknown>;
          const attributes = item.attributes && typeof item.attributes === 'object'
            ? item.attributes as Record<string, unknown>
            : item;
          const id = String(item.documentId ?? item.id ?? '');
          const title = typeof attributes.title === 'string' ? attributes.title.trim() : '';
          if (!id || !title) return [];

          const description = typeof attributes.excerpt === 'string' ? attributes.excerpt : '';
          const coverLine = description.match(/(?:^|\n)\s*Image de couverture\s*:\s*(\S+)/i);
          const attachments = Array.isArray(attributes.attachments) ? attributes.attachments : [];
          const attachmentImage = attachments.find((attachment) => {
            if (!attachment || typeof attachment !== 'object') return false;
            const file = attachment as Record<string, unknown>;
            const url = typeof file.url === 'string' ? file.url : '';
            return typeof file.type === 'string' && file.type.startsWith('image/')
              || /\.(?:avif|gif|jpe?g|png|webp)(?:[?#]|$)/i.test(url);
          }) as Record<string, unknown> | undefined;
          const coverImage = getCoverImage(attributes.coverImage)
            ?? getCoverImage(attributes.cover_image)
            ?? getCoverImage(coverLine?.[1])
            ?? getCoverImage(attachmentImage?.url);
          const slug = typeof attributes.slug === 'string' && attributes.slug ? attributes.slug : id;
          return [{
            id: `published-${id}`,
            tag: typeof attributes.category === 'string' ? attributes.category : t('announcements.tagEvent', 'Annonce'),
            title,
            description: description.replace(/(?:^|\n)\s*Image de couverture\s*:\s*\S+/i, '').trim(),
            coverImage,
            link: `/annonces#${encodeURIComponent(slug)}`,
            cta: t('announcements.ctaPublished', 'Lire l’annonce'),
          }];
        });

        const signature = JSON.stringify(mapped);
        if (active && signature !== publishedSignature.current) {
          publishedSignature.current = signature;
          setPublishedAnnouncements(mapped);
          setCurrentIndex(0);
        }
      } catch {
        // Keep the institutional announcements if the public feed is unavailable.
      }
    };

    void loadPublishedAnnouncements();
    const refreshInterval = setInterval(() => void loadPublishedAnnouncements(), 30_000);

    return () => {
      active = false;
      clearInterval(refreshInterval);
    };
  }, [t]);

  useEffect(() => {
    // Vérifier si l'annonce a été fermée il y a moins de 3 minutes
    const closedAt = sessionStorage.getItem('inptic_announcement_closed_at');
    if (closedAt) {
      const elapsed = Date.now() - parseInt(closedAt, 10);
      if (elapsed < 3 * 60 * 1000) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    } else {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isVisible, announcements.length]);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('inptic_announcement_closed_at', Date.now().toString());
  };

  if (!isVisible) return null;

  const current = announcements[currentIndex];

  return (
    <div className="container-x my-4 px-4 md:px-0 relative z-[1000]">
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#D4AF37]/80 bg-gradient-to-r from-slate-950 via-[#14306b] to-slate-950 p-4 sm:p-5 text-white shadow-[0_0_35px_rgba(212,175,55,0.35)] ring-2 ring-[#D4AF37]/25">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-[#D4AF37]/20 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex min-w-0 flex-1 items-start gap-3.5 sm:items-center">
            {current.coverImage ? (
              <img
                src={current.coverImage}
                alt={current.title}
                loading="lazy"
                decoding="async"
                className="h-20 w-28 shrink-0 rounded-xl object-cover sm:h-24 sm:w-36"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-slate-950 shadow-lg shadow-[#D4AF37]/30">
                <Megaphone size={20} className="animate-bounce" />
              </div>
            )}

            <div key={currentIndex} className="min-w-0 flex-1 transition-all">
              <style jsx>{`
                @keyframes slideInFromRight {
                  0% {
                    opacity: 0;
                    transform: translateX(80px);
                  }
                  100% {
                    opacity: 1;
                    transform: translateX(0);
                  }
                }
                .slide-in-1s {
                  animation: slideInFromRight 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
              `}</style>
              <div className="slide-in-1s">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 border border-amber-400/30">
                    {current.tag}
                  </span>
                  <span className="text-[10px] text-slate-400">Annonce {currentIndex + 1} / {announcements.length}</span>
                </div>
                <h3 className="mt-1 text-sm sm:text-base font-black text-white">{current.title}</h3>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-1 sm:line-clamp-none">{current.description}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
            <Link
              href={current.link}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-slate-950 shadow-lg hover:bg-[#e6c141] transition transform hover:scale-105 active:scale-95"
            >
              <span>{current.cta}</span>
              <Sparkles size={13} />
            </Link>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)}
                className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20 transition text-slate-200"
                aria-label="Annonce précédente"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
                className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20 transition text-slate-200"
                aria-label="Annonce suivante"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={handleClose}
                className="rounded-lg bg-white/10 p-1.5 hover:bg-red-500/30 transition text-slate-400 hover:text-white ml-2"
                aria-label="Fermer l'annonce"
                title="Masquer (réapparaîtra dans 3 minutes)"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
