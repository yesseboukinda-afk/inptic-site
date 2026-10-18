import { XMLParser } from 'fast-xml-parser';
import { RSS_SOURCES } from '@/lib/techVeilleSources';

export type TechNewsItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  region: string;
  url: string;
  domain: 'IA' | 'Base de données' | 'Développement' | 'Réseaux';
  date: string;
  publishedAt: string | null;
  coverImage: string;
  timestamp: number;
};

type TechNewsSource = (typeof RSS_SOURCES)[number];

const rssParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  trimValues: true,
});

const DOMAIN_PATTERN: Record<TechNewsItem['domain'], RegExp> = {
  IA: /ai|artificial|gpt|llm|machine learning|openai|deepseek|claude|agent/i,
  'Base de données': /sql|postgres|database|mongo|redis|data engineer|data lake/i,
  Développement: /javascript|typescript|software|programming|developer|code|github|node\.js/i,
  Réseaux: /network|cloud|security|wifi|devops|linux|telecom|cyber/i,
};

function getDomain(values: string[]): TechNewsItem['domain'] {
  const text = values.join(' ');
  const match = Object.entries(DOMAIN_PATTERN).find(([, pattern]) => pattern.test(text))?.[0];
  return (match || 'Développement') as TechNewsItem['domain'];
}

function asEntries(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
  }
  if (typeof value === 'object' && value !== null) return [value as Record<string, unknown>];
  return [];
}

function textValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object' && value !== null && '#text' in value) {
    return textValue((value as Record<string, unknown>)['#text']);
  }
  return '';
}

function cleanFeedText(value: unknown): string {
  return textValue(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&#(?:x([0-9a-f]{1,6})|(\d{1,7}));/gi, (entity, hex: string | undefined, decimal: string | undefined) => {
      const codePoint = Number.parseInt(hex || decimal || '', hex ? 16 : 10);
      return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : ' ';
    })
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&rsquo;|&lsquo;/gi, '’')
    .replace(/&rdquo;|&ldquo;/gi, '”')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&hellip;/gi, '…')
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
  try {
    const url = new URL(textValue(value));
    return url.protocol === 'https:' ? url.toString() : '';
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

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function parseFeed(source: TechNewsSource, payload: Record<string, unknown>): TechNewsItem[] {
  const rssChannel = payload.rss && typeof payload.rss === 'object'
    ? (payload.rss as Record<string, unknown>).channel
    : null;
  const atomFeed = payload.feed;
  const rdfFeed = payload['rdf:RDF'];
  const rdfFeedItems = rdfFeed && typeof rdfFeed === 'object'
    ? (rdfFeed as Record<string, unknown>).item
    : undefined;
  const feed = (rssChannel || atomFeed || rdfFeed) as Record<string, unknown> | null;
  if (!feed) return [];

  return asEntries(feed.item || feed.entry || rdfFeedItems)
    .map((entry): TechNewsItem | null => {
      const title = cleanFeedText(entry.title);
      const url = feedLink(entry);
      if (!title || !url) return null;

      const summary = makeSummary(
        entry.description || entry.summary || entry['content:encoded'] || entry.content,
        title,
      );
      const dateString = textValue(entry.pubDate || entry.published || entry.updated || entry['dc:date']);
      const parsedTimestamp = Date.parse(dateString);
      const timestamp = Number.isFinite(parsedTimestamp) ? parsedTimestamp : 0;
      return {
        id: `rss-${hashString(url)}`,
        title,
        summary,
        source: source.name,
        region: source.region,
        url,
        domain: getDomain([title, summary, source.name]),
        date: timestamp
          ? new Date(timestamp).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'Africa/Libreville',
          })
          : '',
        publishedAt: timestamp ? new Date(timestamp).toISOString() : null,
        coverImage: feedImage(entry),
        timestamp,
      };
    })
    .filter((item): item is TechNewsItem => item !== null)
    .sort((first, second) => second.timestamp - first.timestamp);
}

export async function fetchTechNewsFromSource(
  source: TechNewsSource,
  forceRefresh = false,
): Promise<{ items: TechNewsItem[]; errorCode: string | null }> {
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'INPTIC-International-Tech-News/1.0',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(8000),
      ...(forceRefresh ? { cache: 'no-store' as const } : { next: { revalidate: 900 } }),
    });
    if (!response.ok) return { items: [], errorCode: `HTTP_${response.status}` };

    const payload = rssParser.parse(await response.text()) as Record<string, unknown>;
    return { items: parseFeed(source, payload), errorCode: null };
  } catch (error) {
    return {
      items: [],
      errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    };
  }
}
