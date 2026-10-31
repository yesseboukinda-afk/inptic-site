'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Megaphone, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type CarouselAnnouncement = {
  id: string;
  tag: string;
  title: string;
  description: string;
  images: string[];
  link: string;
  cta: string;
};

function getCoverImage(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const url = value.trim();
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return undefined;
    if (
      parsed.pathname.startsWith('/api/storage/annonces-attachments/') &&
      ['inptic-ga.org', 'www.inptic-ga.org', 'localhost'].includes(parsed.hostname)
    ) {
      return `${parsed.pathname}${parsed.search}`;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function getAnnouncementImages(description: string, attachments: unknown[], coverImage: unknown, coverImageSnake: unknown) {
  const candidates: unknown[] = [
    coverImage,
    coverImageSnake,
    ...Array.from(description.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g), (match) => match[1]),
  ];
  const coverLine = description.match(/(?:^|\n)\s*Image de couverture\s*:\s*(\S+)/i);
  if (coverLine?.[1]) candidates.push(coverLine[1]);

  for (const attachment of attachments) {
    if (!attachment || typeof attachment !== 'object') continue;
    const file = attachment as Record<string, unknown>;
    const url = typeof file.url === 'string' ? file.url : '';
    if (
      typeof file.type === 'string' && file.type.startsWith('image/') ||
      /\.(?:avif|gif|jpe?g|png|webp)(?:[?#]|$)/i.test(url)
    ) candidates.push(url);
  }

  return [...new Set(candidates.map(getCoverImage).filter((url): url is string => Boolean(url)))];
}

export default function AnnouncementsCarousel() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [publishedAnnouncements, setPublishedAnnouncements] = useState<CarouselAnnouncement[]>([]);
  const publishedSignature = useRef('');
  const announcements = publishedAnnouncements;

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
          const attachments = Array.isArray(attributes.attachments) ? attributes.attachments : [];
          const images = getAnnouncementImages(
            description,
            attachments,
            attributes.coverImage,
            attributes.cover_image,
          );
          const slug = typeof attributes.slug === 'string' && attributes.slug ? attributes.slug : id;
          const cleanDescription = description
            .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
            .replace(/(?:^|\n)\s*Image de couverture\s*:\s*\S+/i, '')
            .trim();
          return [{
            id: `published-${id}`,
            tag: typeof attributes.category === 'string' ? attributes.category : t('announcements.tagEvent', 'Annonce'),
            title,
            description: cleanDescription,
            images,
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
        // Keep the last successfully loaded public announcements.
      } finally {
        if (active) setIsLoadingAnnouncements(false);
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
    if (!isVisible || announcements.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isVisible, announcements.length]);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('inptic_announcement_closed_at', Date.now().toString());
  };

  if (!isVisible || (!isLoadingAnnouncements && announcements.length === 0)) return null;

  const current = announcements[currentIndex];
  if (!current) {
    return (
      <div className="container-x relative z-10 my-3 min-h-[84px] px-4 md:px-0" aria-hidden="true">
        <div className="flex min-h-[60px] items-center gap-3 rounded-full bg-[#073b8c] px-3 py-2 shadow-[0_8px_24px_rgba(7,59,140,0.18)] sm:gap-4 sm:px-4" />
      </div>
    );
  }

  return (
    <div className="container-x relative z-10 my-3 min-h-[84px] px-4 md:px-0">
      <div className="flex min-h-[60px] items-center gap-3 rounded-full bg-[#073b8c] px-3 py-2 text-white shadow-[0_8px_24px_rgba(7,59,140,0.18)] sm:gap-4 sm:px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-blue-950 sm:h-11 sm:w-11">
          <Megaphone size={19} aria-hidden="true" />
        </div>

        <div className="h-9 w-px shrink-0 bg-white/30" aria-hidden="true" />

        <Link
          href={current.link}
          className="min-w-0 flex-1 text-left text-xs leading-5 text-blue-50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300 sm:text-sm"
          aria-label={`${current.tag} : ${current.title}. ${current.cta}`}
        >
          <span className="font-bold">{current.title}</span>
          {current.description && (
            <span className="hidden sm:inline"> : {current.description}</span>
          )}
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {current.images.slice(0, 4).map((image, index) => (
            <Link
              key={`${image}-${index}`}
              href={current.link}
              aria-label={`Ouvrir l’annonce « ${current.title} », photo ${index + 1}`}
              className={`inline-flex h-8 w-8 overflow-hidden rounded-full border-2 border-white/80 transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 sm:h-11 sm:w-11 ${
                index >= 2 ? 'hidden sm:flex' : ''
              }`}
            >
                <Image
                  src={image}
                  alt=""
                  width={44}
                  height={44}
                  loading="lazy"
                  decoding="async"
                  quality={65}
                  sizes="44px"
                  unoptimized={image.startsWith('http')}
                  className="h-full w-full object-cover"
                />
            </Link>
          ))}
          {current.images.length > 2 && (
            <Link
              href={current.link}
              className="flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-white/80 px-1 text-[10px] font-bold text-white sm:hidden"
              aria-label={`Ouvrir l’annonce et voir ${current.images.length - 2} autres photos`}
            >
              +{current.images.length - 2}
            </Link>
          )}
          {current.images.length > 4 && (
            <Link
              href={current.link}
              className="hidden h-11 min-w-11 items-center justify-center rounded-full border-2 border-white/80 px-2 text-xs font-bold text-white sm:flex"
              aria-label={`Ouvrir l’annonce et voir ${current.images.length - 4} autres photos`}
            >
              +{current.images.length - 4}
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
          className="flex h-9 w-8 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          aria-label="Annonce suivante"
        >
          <ChevronRight size={23} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          aria-label="Fermer les annonces"
          title="Masquer (réapparaîtra dans 3 minutes)"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
