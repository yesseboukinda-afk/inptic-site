import { XMLParser } from 'fast-xml-parser';
import { NextResponse } from 'next/server';
import { DEFAULT_YOUTUBE_CHANNEL_ID } from '@/lib/youtube';
const feedParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  trimValues: true,
});

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? value as Record<string, unknown>
    : null;
}

function textValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  const record = asRecord(value);
  return record ? textValue(record['#text']) : '';
}

export async function GET() {
  const channelId = process.env.YOUTUBE_CHANNEL_ID || DEFAULT_YOUTUBE_CHANNEL_ID;
  const feedUrl = new URL('https://www.youtube.com/feeds/videos.xml');
  feedUrl.searchParams.set('channel_id', channelId);

  try {
    const response = await fetch(feedUrl, {
      headers: { Accept: 'application/atom+xml' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error(`YouTube RSS indisponible (HTTP ${response.status}).`);
      return NextResponse.json({ error: 'Le flux YouTube est temporairement indisponible.' }, { status: 502 });
    }

    const parsed = asRecord(feedParser.parse(await response.text()));
    const feed = asRecord(parsed?.feed);
    const entries = Array.isArray(feed?.entry) ? feed.entry : feed?.entry ? [feed.entry] : [];
    const latest = asRecord(entries[0]);
    const videoId = textValue(latest?.['yt:videoId']);
    const title = textValue(latest?.title);
    const publishedAt = textValue(latest?.published);

    if (!/^[\w-]{11}$/.test(videoId) || !title) {
      return NextResponse.json({ video: null });
    }

    return NextResponse.json({
      video: {
        id: videoId,
        title,
        publishedAt: publishedAt || null,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      },
    });
  } catch (error) {
    console.error('Impossible de charger la dernière vidéo YouTube:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de charger la dernière vidéo YouTube.' }, { status: 502 });
  }
}
