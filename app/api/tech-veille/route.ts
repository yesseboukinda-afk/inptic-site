import { NextRequest, NextResponse } from 'next/server';
import { RSS_SOURCES } from '@/lib/techVeilleSources';
import { fetchTechNewsFromSource } from '@/lib/tech-veille';

export async function GET(request: NextRequest) {
  const articleUrl = request.nextUrl.searchParams.get('article');
  if (articleUrl) {
    try {
      const url = new URL(articleUrl);
      const parts = url.pathname.split('/').filter(Boolean);
      if ((url.hostname !== 'dev.to' && url.hostname !== 'www.dev.to') || parts.length !== 2 ||
          !parts.every((part) => /^[a-zA-Z0-9_-]+$/.test(part))) {
        return NextResponse.json({ error: 'Source d’article invalide.' }, { status: 400 });
      }

      const response = await fetch(`https://dev.to/api/articles/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`, {
        headers: { 'User-Agent': 'INPTIC-TechWatch/1.0' },
        next: { revalidate: 3600 },
      });
      if (!response.ok) return NextResponse.json({ error: 'Article source indisponible.' }, { status: 404 });

      const article = await response.json();
      const image = typeof article.cover_image === 'string' && article.cover_image.startsWith('https://')
        ? article.cover_image
        : typeof article.social_image === 'string' && article.social_image.startsWith('https://')
          ? article.social_image
          : '';
      return NextResponse.json({ success: true, item: { url: article.url, coverImage: image } });
    } catch {
      return NextResponse.json({ error: 'Impossible de récupérer la couverture de l’article.' }, { status: 502 });
    }
  }

  const forceRefresh = request.nextUrl.searchParams.get('refresh') === '1';

  try {
    const sourceResults = await Promise.all(
      RSS_SOURCES.map((source) => fetchTechNewsFromSource(source, forceRefresh)),
    );
    const feedItems = sourceResults
      .flatMap((result) => result.items.slice(0, 1))
      .sort((first, second) => second.timestamp - first.timestamp);
    sourceResults.forEach((result, index) => {
      if (result.errorCode) {
        console.error(`Flux RSS indisponible (${RSS_SOURCES[index].name}):`, result.errorCode);
      }
    });
    const seenDomains = new Set<string>();
    const formatted = feedItems.filter((item) => {
      const hostname = new URL(item.url).hostname.toLowerCase().replace(/^www\./, '');
      if (seenDomains.has(hostname)) return false;
      seenDomains.add(hostname);
      return true;
    }).slice(0, RSS_SOURCES.length).map(({ timestamp: _timestamp, ...item }) => item);
    const hasLiveArticles = formatted.length > 0;

    return NextResponse.json({
      success: true,
      items: formatted,
      source: hasLiveArticles ? 'live' : 'fallback',
      ...(hasLiveArticles ? {} : {
        fallbackReason: 'Aucun flux de veille n’est momentanément accessible.',
      }),
    });
  } catch (error) {
    console.error('Tech veille fetch error:', error);
    return NextResponse.json({
      success: true,
      items: [],
      source: 'fallback',
      fallbackReason: 'Impossible de joindre les flux RSS/Atom de veille.',
    });
  }
}
