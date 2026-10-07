import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { RSS_SOURCES } from '@/lib/techVeilleSources';

const rssParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  trimValues: true,
});

const DOMAIN_PATTERN: Record<'IA' | 'Base de données' | 'Développement' | 'Réseaux', RegExp> = {
  'IA': /ai|artificial|gpt|llm|machine learning|openai|deepseek|claude|agent/i,
  'Base de données': /sql|postgres|database|mongo|redis|data engineer|data lake/i,
  'Développement': /javascript|typescript|software|programming|developer|code|github|node\.js/i,
  'Réseaux': /network|cloud|security|wifi|devops|linux|telecom|cyber/i,
};

function getDomain(values: string[]) {
  const text = values.join(' ');
  return (Object.entries(DOMAIN_PATTERN).find(([, pattern]) => pattern.test(text))?.[0] || 'Développement') as keyof typeof DOMAIN_PATTERN;
}

function asEntries(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
  if (typeof value === 'object' && value !== null) return [value as Record<string, unknown>];
  return [];
}

function textValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object' && value !== null && '#text' in value) return textValue((value as Record<string, unknown>)['#text']);
  return '';
}

function cleanFeedText(value: unknown): string {
  return textValue(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeSummary(value: unknown, title: string) {
  let summary = cleanFeedText(value);
  if (summary.toLocaleLowerCase().startsWith(title.toLocaleLowerCase())) {
    summary = summary.slice(title.length).replace(/^\s*[-:—|]+\s*/, '').trim();
  }
  if (!summary) return title;
  if (summary.length <= 320) return summary;

  const preview = summary.slice(0, 320);
  const sentenceEnd = preview.search(/[.!?](?:\s|$)/);
  if (sentenceEnd >= 120) return `${preview.slice(0, sentenceEnd + 1).trim()}…`;

  const wordEnd = preview.lastIndexOf(' ');
  return `${preview.slice(0, wordEnd > 0 ? wordEnd : preview.length).trim()}…`;
}

function feedLink(entry: Record<string, unknown>): string {
  const links = asEntries(entry.link);
  const selected = links.find((link) => !link['@_rel'] || link['@_rel'] === 'alternate') || links[0];
  const value = selected?.['@_href'] || entry.link || entry.guid || entry.id;
  const url = textValue(value);
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch {
    return '';
  }
}

function feedImage(entry: Record<string, unknown>): string {
  for (const candidate of [entry['media:content'], entry['media:thumbnail'], entry.enclosure]) {
    for (const imageEntry of asEntries(candidate)) {
      const url = textValue(imageEntry['@_url'] || imageEntry.url);
      if (url.startsWith('https://')) return url;
    }
  }

  const content = textValue(entry['content:encoded'] || entry.content || entry.description || entry.summary);
  const imageUrl = content.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
  return imageUrl?.startsWith('https://') ? imageUrl : '';
}

async function fetchLatestFromSource(source: (typeof RSS_SOURCES)[number], forceRefresh: boolean) {
  try {
    const response = await fetch(source.url, {
      headers: { 'User-Agent': 'INPTIC-International-Tech-News/1.0', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
      signal: AbortSignal.timeout(8000),
      ...(forceRefresh ? { cache: 'no-store' as const } : { next: { revalidate: 900 } }),
    });
    if (!response.ok) return null;

    const parsed = rssParser.parse(await response.text()) as Record<string, unknown>;
    const rssChannel = parsed.rss && typeof parsed.rss === 'object' ? (parsed.rss as Record<string, unknown>).channel : null;
    const atomFeed = parsed.feed;
    const rdfFeed = parsed['rdf:RDF'];
    const rdfFeedItems = rdfFeed && typeof rdfFeed === 'object'
      ? (rdfFeed as Record<string, unknown>).item
      : undefined;
    const feed = (rssChannel || atomFeed || rdfFeed) as Record<string, unknown> | null;
    if (!feed) return null;

    const entries = asEntries(feed.item || feed.entry || rdfFeedItems).map((entry) => {
      const title = cleanFeedText(entry.title);
      const summary = makeSummary(entry.description || entry.summary || entry['content:encoded'] || entry.content, title);
      const url = feedLink(entry);
      if (!title || !url) return null;

      const dateString = textValue(entry.pubDate || entry.published || entry.updated || entry['dc:date']);
      const timestamp = Date.parse(dateString) || 0;
      return {
        id: `rss-${hashString(url)}`,
        title,
        summary,
        source: source.name,
        region: source.region,
        url,
        domain: getDomain([title, summary, source.name]),
        date: new Date(timestamp || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
        publishedAt: timestamp ? new Date(timestamp).toISOString() : null,
        coverImage: feedImage(entry),
        timestamp,
      };
    }).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    entries.sort((first, second) => second.timestamp - first.timestamp);
    return entries[0] || null;
  } catch {
    return null;
  }
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

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
    const feedItems = (await Promise.all(RSS_SOURCES.map((source) => fetchLatestFromSource(source, forceRefresh))))
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((first, second) => second.timestamp - first.timestamp);
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
