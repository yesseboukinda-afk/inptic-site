import { NextRequest, NextResponse } from 'next/server';

type MentionItem = {
  id: string;
  source: string;
  author: string;
  content: string;
  sentiment: 'positif' | 'neutre' | 'negatif';
  date: string;
  createdAt?: string;
  url: string;
  platform: 'Facebook' | 'YouTube' | 'Twitter/X' | 'LinkedIn' | 'Google Avis' | 'Presse en ligne' | 'WhatsApp / Groupes';
};

type SourceStatus = 'available' | 'unavailable' | 'not_configured';

// In-memory store pour les commentaires captés manuellement ou par webhook.
let liveIngestedComments: MentionItem[] = [];

function formatCommentDate(value: string | undefined) {
  if (!value) return 'Date indisponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date indisponible';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Libreville',
  }).format(date);
}

function classifySentiment(content: string): MentionItem['sentiment'] {
  const lower = content.toLocaleLowerCase('fr');
  if (/nul|incompétent|mauvais|scandale|problème|arnaque|faux|lent|plainte|déçu|décevant/i.test(lower)) {
    return 'negatif';
  }
  if (/excellent|super|merci|bravo|félicit|succès|top|génial|recommande/i.test(lower)) {
    return 'positif';
  }
  return 'neutre';
}

export async function GET(request: NextRequest) {
  const forceRefresh = request.nextUrl.searchParams.get('refresh') === '1';
  const facebookPageId = process.env.FACEBOOK_PAGE_ID || '61557159190234';
  const fbAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  const youtubeChannelId = process.env.YOUTUBE_CHANNEL_ID;
  const youtubeChannelHandle = process.env.YOUTUBE_CHANNEL_HANDLE || 'INPTICGabonOfficiel';
  let facebookSource: SourceStatus = fbAccessToken ? 'unavailable' : 'not_configured';
  let youtubeSource: SourceStatus = youtubeApiKey ? 'unavailable' : 'not_configured';
  let pressSource: 'available' | 'unavailable' = 'unavailable';

  const mentions: MentionItem[] = [...liveIngestedComments];

  // Read recent comments on the Page's latest posts.
  if (fbAccessToken) {
    try {
      const fields = 'id,message,created_time,permalink_url,comments.limit(25){id,message,created_time,from,permalink_url}';
      const fbParams = new URLSearchParams({ fields, limit: '10', access_token: fbAccessToken });
      const graphVersion = process.env.FACEBOOK_GRAPH_API_VERSION || 'v23.0';
      const fbGraphUrl = `https://graph.facebook.com/${graphVersion}/${facebookPageId}/feed?${fbParams}`;
      const fbRes = await fetch(fbGraphUrl, forceRefresh ? { cache: 'no-store' } : { next: { revalidate: 60 } });
      if (fbRes.ok) {
        facebookSource = 'available';
        const fbJson = await fbRes.json();
        const posts = Array.isArray(fbJson.data) ? fbJson.data : [];
        for (const post of posts) {
          const comments = Array.isArray(post.comments?.data) ? post.comments.data : [];
          for (const comment of comments) {
            const messageText = typeof comment.message === 'string' ? comment.message.trim() : '';
            if (!messageText || !comment.created_time) continue;
            mentions.push({
              id: `fb-live-${comment.id}`,
              source: 'Page Facebook Officielle INPTIC',
              author: comment.from?.name || 'Utilisateur Facebook',
              content: messageText,
              sentiment: classifySentiment(messageText),
              createdAt: comment.created_time,
              date: formatCommentDate(comment.created_time),
              url: comment.permalink_url || post.permalink_url || `https://www.facebook.com/${comment.id}`,
              platform: 'Facebook',
            });
          }
        }
      }
    } catch (err) {
      console.error('Erreur Facebook Graph API:', err);
    }
  }

  // YouTube Data API returns recent top-level comments for the configured channel.
  if (youtubeApiKey) {
    try {
      let resolvedChannelId = youtubeChannelId;
      if (!resolvedChannelId) {
        const channelParams = new URLSearchParams({
          part: 'id',
          forHandle: youtubeChannelHandle,
          key: youtubeApiKey,
        });
        const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?${channelParams}`, {
          next: { revalidate: 3600 },
        });
        if (!channelRes.ok) throw new Error(`Résolution de la chaîne YouTube refusée (HTTP ${channelRes.status}).`);
        const channelJson = await channelRes.json();
        resolvedChannelId = channelJson.items?.[0]?.id;
      }
      if (!resolvedChannelId) throw new Error('Identifiant de chaîne YouTube introuvable.');

      const youtubeParams = new URLSearchParams({
        part: 'snippet',
        allThreadsRelatedToChannelId: resolvedChannelId,
        maxResults: '10',
        order: 'time',
        key: youtubeApiKey,
      });
      const youtubeRes = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?${youtubeParams}`, {
        ...(forceRefresh ? { cache: 'no-store' as const } : { next: { revalidate: 60 } }),
      });

      if (youtubeRes.ok) {
        youtubeSource = 'available';
        const youtubeJson = await youtubeRes.json();
        const threads = Array.isArray(youtubeJson.items) ? youtubeJson.items : [];
        for (const thread of threads) {
          const comment = thread.snippet?.topLevelComment;
          const snippet = comment?.snippet;
          const messageText = typeof snippet?.textDisplay === 'string' ? snippet.textDisplay.replace(/<[^>]*>/g, '').trim() : '';
          if (!messageText || !snippet?.publishedAt) continue;
          const videoId = thread.snippet?.videoId;
          const commentId = comment.id || thread.id;
          mentions.push({
            id: `yt-live-${commentId}`,
            source: 'Chaîne YouTube INPTIC',
            author: snippet.authorDisplayName || 'Utilisateur YouTube',
            content: messageText,
            sentiment: classifySentiment(messageText),
            createdAt: snippet.publishedAt,
            date: formatCommentDate(snippet.publishedAt),
            url: videoId ? `https://www.youtube.com/watch?v=${videoId}&lc=${commentId}` : 'https://www.youtube.com',
            platform: 'YouTube',
          });
        }
      }
    } catch (err) {
      console.error('Erreur YouTube Data API:', err);
    }
  }

  // 3. Interroger les flux RSS de presse et du web pour INPTIC Gabon
  try {
    const rssUrl = 'https://news.google.com/rss/search?q=INPTIC+Gabon+OR+%22Inptic-Gabon%22&hl=fr&gl=GA&ceid=GA:fr';
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      ...(forceRefresh ? { cache: 'no-store' as const } : { next: { revalidate: 300 } }),
    });

    if (res.ok) {
      pressSource = 'available';
      const xmlText = await res.text();
      const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || [];

      itemMatches.slice(0, 8).forEach((itemXml, index) => {
        const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
        const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);

        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'Mention INPTIC';
        const url = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'https://google.com';
        const source = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'Presse en ligne / Web';
        const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Récemment';

        let sentiment: 'positif' | 'neutre' | 'negatif' = 'neutre';
        const lower = title.toLowerCase();
        if (/excellence|succ[èe]s|lance|innovation|belle|victoire|reconnaissance|prog[rè]s|numerique|technologie/i.test(lower)) {
          sentiment = 'positif';
        } else if (/scandale|gr[èe]ve|incomp[ée]tent|nul|fausse|alerte|plainte|probl[èe]me/i.test(lower)) {
          sentiment = 'negatif';
        }

        mentions.push({
          id: `live-rss-${index}`,
          source,
          author: source,
          content: title,
          sentiment,
          date: pubDate,
          url,
          platform: /facebook/i.test(source) ? 'Facebook' : 'Presse en ligne',
        });
      });
    }
  } catch (error) {
    console.error('E-reputation fetch error:', error);
  }

  const comments = mentions
    .filter((mention) => mention.platform === 'Facebook' || mention.platform === 'YouTube')
    .sort((first, second) => Date.parse(second.createdAt || '') - Date.parse(first.createdAt || ''))
    .slice(0, 10);

  return NextResponse.json({
    success: true,
    mentions,
    comments,
    sources: { facebook: facebookSource, youtube: youtubeSource, press: pressSource },
  });
}

// Ingestion par Webhook ou publication manuelle d'un commentaire capturé
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const author = body.author || 'Visiteur Réseau Social';
    const content = body.content || body.message || '';
    const supportedPlatforms = ['Facebook', 'YouTube', 'Twitter/X', 'Google Avis', 'LinkedIn'] as const;
    if (body.platform && !supportedPlatforms.includes(body.platform)) {
      return NextResponse.json({ error: 'Cette plateforme n’est pas prise en charge par la veille e-réputation.' }, { status: 400 });
    }
    const platform = supportedPlatforms.includes(body.platform) ? body.platform : 'Facebook';
    const url = body.url || 'https://www.facebook.com/people/Inptic-Gabon/61557159190234/';

    const sentiment = classifySentiment(content);
    const createdAt = new Date().toISOString();

    const newMention: MentionItem = {
      id: `ingest-${Date.now()}`,
      source: `Page ${platform} INPTIC`,
      author,
      content,
      sentiment,
      createdAt,
      date: formatCommentDate(createdAt),
      url,
      platform,
    };

    liveIngestedComments.unshift(newMention);

    return NextResponse.json({ success: true, mention: newMention });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
