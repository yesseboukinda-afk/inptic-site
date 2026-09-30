import { NextRequest, NextResponse } from 'next/server';

type MentionItem = {
  id: string;
  source: string;
  author: string;
  content: string;
  sentiment: 'positif' | 'neutre' | 'negatif';
  date: string;
  url: string;
  platform: 'Facebook' | 'Twitter/X' | 'LinkedIn' | 'Google Avis' | 'Presse en ligne' | 'WhatsApp / Groupes';
};

// In-memory store pour les commentaires Facebook/Sociaux captés par webhook ou scan direct
let liveIngestedComments: MentionItem[] = [];

export async function GET() {
  const officialFbUrl = 'https://www.facebook.com/people/Inptic-Gabon/61557159190234/?mibextid=wwXIfr';
  const fbAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.NEXT_PUBLIC_FACEBOOK_TOKEN;

  const mentions: MentionItem[] = [...liveIngestedComments];

  // 1. Tenter d'interroger l'API Graph de Facebook pour la page officielle INPTIC (si jeton configuré)
  if (fbAccessToken) {
    try {
      const fbGraphUrl = `https://graph.facebook.com/v19.0/61557159190234/comments?fields=from,message,created_time,permalink_url&access_token=${fbAccessToken}`;
      const fbRes = await fetch(fbGraphUrl, { next: { revalidate: 60 } });
      if (fbRes.ok) {
        const fbJson = await fbRes.json();
        if (Array.isArray(fbJson.data)) {
          fbJson.data.forEach((comment: any) => {
            const authorName = comment.from?.name || 'Utilisateur Facebook';
            const messageText = comment.message || '';
            const commentUrl = comment.permalink_url || officialFbUrl;
            const createdTime = comment.created_time
              ? new Date(comment.created_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              : 'À l’instant';

            let sentiment: 'positif' | 'neutre' | 'negatif' = 'neutre';
            const lower = messageText.toLowerCase();
            if (/excellent|super|merci|bravo|félicitation|succès|top/i.test(lower)) sentiment = 'positif';
            else if (/nul|incompétent|mauvais|scandale|problème|arnaque|faux|lent/i.test(lower)) sentiment = 'negatif';

            mentions.push({
              id: `fb-live-${comment.id || Date.now()}`,
              source: 'Page Facebook Officielle INPTIC',
              author: authorName,
              content: messageText,
              sentiment,
              date: createdTime,
              url: commentUrl,
              platform: 'Facebook',
            });
          });
        }
      }
    } catch (err) {
      console.error('Erreur Facebook Graph API:', err);
    }
  }

  // 2. Interroger les flux RSS de presse et du web pour INPTIC Gabon
  try {
    const rssUrl = 'https://news.google.com/rss/search?q=INPTIC+Gabon+OR+%22Inptic-Gabon%22&hl=fr&gl=GA&ceid=GA:fr';
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 300 },
    });

    if (res.ok) {
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

  return NextResponse.json({ success: true, mentions });
}

// Ingestion par Webhook ou publication manuelle d'un commentaire capturé
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const author = body.author || 'Visiteur Facebook';
    const content = body.content || body.message || '';
    const platform = body.platform || 'Facebook';
    const url = body.url || 'https://www.facebook.com/people/Inptic-Gabon/61557159190234/';

    let sentiment: 'positif' | 'neutre' | 'negatif' = body.sentiment || 'neutre';
    const lower = content.toLowerCase();
    if (/nul|incompétent|mauvais|scandale|problème|arnaque|fausses|lent|arnaqueurs/i.test(lower)) {
      sentiment = 'negatif';
    } else if (/super|bravo|merci|excellence|top|félicitations/i.test(lower)) {
      sentiment = 'positif';
    }

    const newMention: MentionItem = {
      id: `ingest-${Date.now()}`,
      source: `Page ${platform} INPTIC`,
      author,
      content,
      sentiment,
      date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      url,
      platform,
    };

    liveIngestedComments.unshift(newMention);

    return NextResponse.json({ success: true, mention: newMention });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
