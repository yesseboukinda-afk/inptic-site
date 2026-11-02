type LatestYoutubeVideoProps = {
  channelId: string;
};

export default function LatestYoutubeVideo({ channelId }: LatestYoutubeVideoProps) {
  const uploadsPlaylistId = channelId.replace(/^UC/, 'UU');

  return (
    <>
      <link rel="preconnect" href="https://www.youtube-nocookie.com" />
      <link rel="dns-prefetch" href="//www.youtube-nocookie.com" />
      <article className="md:col-span-2 overflow-hidden rounded-2xl bg-slate-900 text-white shadow-sm">
        <div className="aspect-video w-full bg-black">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(uploadsPlaylistId)}&autoplay=1&mute=1&playsinline=1&rel=0`}
            title="Dernières vidéos de la chaîne YouTube de l’INPTIC"
            loading="eager"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        <div className="p-5 sm:px-7">
          <h3 className="font-bold">Dernières vidéos de la chaîne YouTube de l’INPTIC</h3>
        </div>
      </article>
    </>
  );
}
