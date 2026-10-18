'use client';

import { useEffect, useState } from 'react';

type LatestVideo = {
  id: string;
  title: string;
  publishedAt: string | null;
  url: string;
};

export default function LatestYoutubeVideo() {
  const [video, setVideo] = useState<LatestVideo | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadLatestVideo() {
      try {
        const response = await fetch('/api/youtube/latest-video', { cache: 'no-store' });
        const payload = await response.json() as { video?: LatestVideo | null };
        if (!response.ok) throw new Error('YouTube video unavailable');
        if (active) setVideo(payload.video || null);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadLatestVideo();
    return () => {
      active = false;
    };
  }, []);

  return (
    <article className="md:col-span-2 overflow-hidden rounded-2xl bg-slate-900 text-white shadow-sm">
      {video ? (
        <>
          <div className="aspect-video w-full bg-black">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}`}
              title={video.title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <div className="p-5 sm:px-7">
            <h4 className="line-clamp-2 font-bold">{video.title}</h4>
            {video.publishedAt && (
              <p className="mt-1 text-xs text-slate-400">
                Publiée le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(video.publishedAt))}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-slate-800 px-6 text-center">
          <p className="text-sm text-slate-200">
            {loading
              ? 'Chargement de la dernière vidéo…'
              : loadError
                ? 'La dernière vidéo est temporairement indisponible.'
                : 'Aucune vidéo récente n’est disponible.'}
          </p>
          <a
            href="https://www.youtube.com/@INPTICGabonOfficiel/videos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-cyan-200 underline underline-offset-4"
          >
            Parcourir les vidéos de la chaîne
          </a>
        </div>
      )}
    </article>
  );
}
