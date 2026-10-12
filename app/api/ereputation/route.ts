import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { canAccessStaffService } from '@/lib/roles';
import frenchAdjectiveSentiment from '@/lib/ereputation/french-adjective-sentiment.json';

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
type LexiconEntry = { polarity: number; subjectivity: number; confidence: number };

const frenchAdjectiveEntries: Record<string, LexiconEntry> = frenchAdjectiveSentiment.entries;

async function authorizeFacebookReply(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 });
  }

  if (!canAccessStaffService(user.role, 'reputation', user.user_metadata.service ?? user.user_metadata.department)) {
    return NextResponse.json(
      { error: 'Accès réservé au service Communication.' },
      { status: 403 },
    );
  }

  return null;
}

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
  const words = content
    .toLocaleLowerCase('fr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .match(/[a-z0-9]+/g) ?? [];
  const positiveTerms = [
    'excellent', 'excellente', 'excellents', 'excellentes', 'super', 'super bien',
    'merci', 'grand merci', 'merci beaucoup', 'bravo', 'felicitation', 'felicitations',
    'felicite', 'felicitee', 'felicites', 'feliciter', 'felicitent', 'succes', 'reussite',
    'reussi', 'reussie', 'reussis', 'reussies', 'top', 'genial', 'geniale', 'geniaux',
    'geniales', 'superbe', 'superbes', 'formidable', 'formidables', 'fantastique',
    'fantastiques', 'magnifique', 'magnifiques', 'parfait', 'parfaite', 'parfaits',
    'parfaites', 'impeccable', 'impeccables', 'recommande', 'recommandes', 'recommandee',
    'recommandees', 'recommander', 'satisfait', 'satisfaite', 'satisfaits', 'satisfaites',
    'satisfaction', 'accueillant', 'accueillante', 'bon accueil', 'accueil chaleureux',
    'accueil agreable', 'bien accueilli',
    'bien accueillie', 'efficace', 'efficaces', 'competent', 'competente', 'competents',
    'competentes', 'professionnel', 'professionnelle', 'professionnels', 'professionnelles',
    'professionnalisme', 'a l ecoute', 'rapide', 'rapides', 'ponctuel', 'ponctuelle',
    'ponctuels', 'ponctuelles', 'qualite', 'bonne formation', 'bonne organisation',
    'utile', 'utiles', 'interessant', 'interessante', 'interessants', 'interessantes',
    'clair', 'claire', 'clairs', 'claires', 'propre', 'rassurant', 'rassurante',
    'disponible', 'disponibles', 'solution trouvee', 'bonne experience',
    'tres bonne experience',
    'admis', 'admise', 'admis au concours', 'pas decu', 'pas decue', 'pas mauvais',
  ];
  const negativeTerms = [
    'nul', 'nulle', 'nuls', 'nulles', 'incompetent', 'incompetente', 'incompetents',
    'incompetentes', 'mauvais', 'mauvaise', 'scandale', 'scandaleux',
    'scandaleuse', 'probleme', 'problemes', 'arnaque', 'arnaques', 'escroquerie',
    'escroqueries', 'faux', 'fausse',
    'fausses', 'lent', 'lente', 'lents', 'lentes', 'plainte', 'plaintes', 'decu',
    'decue', 'decus', 'decues', 'decevant', 'decevante', 'decevants', 'decevantes',
    'pas la ligne', 'ne passe pas le concours', 'ne passent pas le concours',
    'ne gagne pas le concours', 'ne gagnent pas le concours', 'honte', 'inadmissible',
    'inacceptable', 'catastrophique', 'catastrophiques', 'horrible', 'horribles',
    'lamentable', 'lamentables', 'mediocre', 'mediocres', 'desagreable', 'desagreables',
    'insupportable', 'insupportables', 'detestable', 'detestables', 'desastre',
    'desastreux',
    'echec', 'echoue', 'echouee', 'difficile', 'difficulte', 'difficultes', 'complique',
    'compliquee', 'retard', 'en retard', 'trop d attente', 'attente interminable',
    'aucune reponse', 'pas de reponse', 'sans reponse', 'ignore', 'ignoree', 'ignores',
    'ignorees', 'absent', 'absente', 'absence', 'manque de', 'panne', 'en panne', 'bug',
    'ne fonctionne pas', 'ne marche pas', 'inaccessible', 'bloque', 'bloquee', 'bloques',
    'bloquees', 'impossible', 'erreur', 'erreurs', 'refus', 'refuse', 'refusee', 'rejet',
    'rejete', 'rejetee', 'corruption', 'favoritisme', 'discrimination', 'fraude', 'vol',
    'mensonge', 'mensonges', 'insatisfait', 'insatisfaite', 'insatisfaits',
    'insatisfaites', 'non satisfait', 'non satisfaite', 'mal organise', 'mal organisee',
    'mauvaise experience', 'aucun moyen',
    'pas de moyen', 'incapable', 'incapables', 'injuste', 'injustes', 'abusif',
    'abusive', 'abusifs', 'abusives', 'irrespectueux', 'irrespectueuse', 'irrespect',
    'regret', 'regrets', 'dommage', 'perte de temps', 'gaspillage',
    'desorganise', 'desorganisee', 'pas serieux', 'pas serieuse', 'manque de serieux',
    'aucun suivi', 'pas de suivi', 'inscription impossible', 'frais abusifs',
    'trop cher', 'ne recommande pas', 'ne conseille pas', 'ne passes pas le concours',
    'ne passent pas le concours', 'ne passe pas le concours', 'ne passes pas ce concours',
    'ne passent pas ce concours', 'ne passe pas ce concours', 'ne gagnes pas le concours',
    'ne gagnent pas le concours', 'ne gagne pas le concours', 'ne gagnes pas au concours',
    'ne gagnent pas au concours', 'ne gagne pas au concours', 'pas recommande',
    'pas recommandee', 'pas terrible', 'pas genial', 'pas geniale', 'pas top',
  ];

  const findMatches = (terms: string[]) => terms.flatMap((term) => {
    const termWords = term.split(' ');
    const positions: number[] = [];
    for (let index = 0; index <= words.length - termWords.length; index += 1) {
      if (termWords.every((word, offset) => words[index + offset] === word)) {
        positions.push(index);
      }
    }
    return positions.map((start) => ({ term, start, end: start + termWords.length }));
  });
  const isNegated = (start: number, end: number) => {
    const previous = words.slice(Math.max(0, start - 4), start);
    const negationIndex = previous.findLastIndex((word) =>
      ['pas', 'plus', 'jamais', 'aucun', 'aucune', 'sans'].includes(word),
    );
    if (negationIndex !== -1) {
      const interveningWords = previous.slice(negationIndex + 1);
      const anotherSentimentTerm = [...positiveTerms, ...negativeTerms].some((term) => {
        const termWords = term.split(' ');
        return interveningWords.some((_, index) =>
          termWords.every((word, offset) => interveningWords[index + offset] === word),
        );
      });
      if (!anotherSentimentTerm) return true;
    }

    return previous.includes('ne') && words.slice(end, end + 3).includes('pas');
  };

  const positiveMatches = findMatches(positiveTerms);
  const negativeMatches = findMatches(negativeTerms);
  for (let index = 0; index < words.length; index += 1) {
    const entry = frenchAdjectiveEntries[words[index]];
    if (words[index] === 'tout' || !entry || entry.subjectivity <= 0 || entry.confidence < 0.7) continue;

    const match = { term: words[index], start: index, end: index + 1 };
    if (entry.polarity >= 0.1) positiveMatches.push(match);
    if (entry.polarity <= -0.1) negativeMatches.push(match);
  }
  const hasNegative = negativeMatches.some(({ start, end }) => !isNegated(start, end))
    || positiveMatches.some(({ term, start, end }) =>
      !term.startsWith('pas ') && isNegated(start, end),
    );
  const hasPositive = positiveMatches.some(({ term, start, end }) =>
    term.startsWith('pas ') || !isNegated(start, end),
  );

  if (hasPositive && hasNegative) return 'neutre';
  if (hasNegative) return 'negatif';
  if (hasPositive) return 'positif';
  return 'neutre';
}

export async function GET(request: NextRequest) {
  const authorizationError = await authorizeFacebookReply(request);
  if (authorizationError) return authorizationError;

  const forceRefresh = request.nextUrl.searchParams.get('refresh') === '1';
  const facebookPageId = process.env.FACEBOOK_PAGE_ID || '61557159190234';
  const fbAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  const youtubeChannelId = process.env.YOUTUBE_CHANNEL_ID;
  const youtubeChannelHandle = process.env.YOUTUBE_CHANNEL_HANDLE || 'INPTICGabonOfficiel';
  let facebookSource: SourceStatus = fbAccessToken ? 'unavailable' : 'not_configured';
  let youtubeSource: SourceStatus = youtubeApiKey ? 'unavailable' : 'not_configured';
  let pressSource: 'available' | 'unavailable' = 'unavailable';
  let facebookError: string | null = null;

  const mentions: MentionItem[] = [...liveIngestedComments];

  await Promise.all([
    (async () => {
      // Read recent comments on the Page's latest posts.
      if (!fbAccessToken) return;
      try {
        const fields = 'id,message,created_time,permalink_url,comments.limit(25){id,message,created_time,from{id,name},permalink_url}';
        const fbParams = new URLSearchParams({ fields, limit: '10', access_token: fbAccessToken });
        const graphVersion = process.env.FACEBOOK_GRAPH_API_VERSION || 'v23.0';
        const fbGraphUrl = `https://graph.facebook.com/${graphVersion}/${facebookPageId}/feed?${fbParams}`;
        const fbRes = await fetch(fbGraphUrl, {
          ...(forceRefresh ? { cache: 'no-store' as const } : { next: { revalidate: 60 } }),
          signal: AbortSignal.timeout(10_000),
        });
        if (fbRes.ok) {
          facebookSource = 'available';
          const fbJson = await fbRes.json();
          const posts = Array.isArray(fbJson.data) ? fbJson.data : [];
          for (const post of posts) {
            const comments = Array.isArray(post.comments?.data) ? post.comments.data : [];
            for (const comment of comments) {
              const messageText = typeof comment.message === 'string' ? comment.message.trim() : '';
              if (!messageText || !comment.created_time) continue;
              const authorName = typeof comment.from?.name === 'string' ? comment.from.name.trim() : '';
              mentions.push({
                id: `fb-live-${comment.id}`,
                source: 'Page Facebook Officielle INPTIC',
                author: authorName || 'Utilisateur Facebook',
                content: messageText,
                sentiment: classifySentiment(messageText),
                createdAt: comment.created_time,
                date: formatCommentDate(comment.created_time),
                url: comment.permalink_url || post.permalink_url || `https://www.facebook.com/${comment.id}`,
                platform: 'Facebook',
              });
            }
          }
        } else {
          const fbJson = await fbRes.json().catch(() => null);
          const errorCode = fbJson?.error?.code;
          if (errorCode === 190) {
            facebookError = 'Le jeton Facebook est invalide ou expiré. Renouvelez le jeton de la Page.';
          } else if (errorCode === 10 || errorCode === 200) {
            facebookError = 'Le jeton ne dispose pas des autorisations nécessaires pour lire les publications et commentaires de la Page.';
          } else if (errorCode === 100) {
            facebookError = 'La Page configurée est introuvable ou inaccessible avec ce jeton. Vérifiez FACEBOOK_PAGE_ID et l’accès du jeton.';
          } else {
            facebookError = `Facebook Graph API a refusé la requête (HTTP ${fbRes.status}${Number.isInteger(errorCode) ? `, code ${errorCode}` : ''}).`;
          }
        }
      } catch (error) {
        facebookError = error instanceof DOMException && error.name === 'TimeoutError'
          ? 'Facebook n’a pas répondu dans le délai imparti. Les autres sources restent accessibles.'
          : 'Impossible de joindre Facebook Graph API depuis le serveur.';
      }
    })(),
    (async () => {
      // YouTube Data API returns recent top-level comments for the configured channel.
      if (!youtubeApiKey) return;
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
    })(),
  ]);

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
          platform: 'Presse en ligne',
        });
      });
    }
  } catch (error) {
    console.error('E-reputation fetch error:', error);
  }

  const platformComments = mentions.filter(
    (mention) => mention.platform === 'Facebook' || mention.platform === 'YouTube',
  );
  const comments = (['Facebook', 'YouTube'] as const)
    .flatMap((platform) => platformComments
      .filter((mention) => mention.platform === platform)
      .sort((first, second) => Date.parse(second.createdAt || '') - Date.parse(first.createdAt || ''))
      .slice(0, 10))
    .sort((first, second) => Date.parse(second.createdAt || '') - Date.parse(first.createdAt || ''));

  return NextResponse.json({
    success: true,
    mentions,
    comments,
    sources: { facebook: facebookSource, youtube: youtubeSource, press: pressSource },
    sourceErrors: { facebook: facebookError },
  });
}

async function siteAuditedPATCH(request: NextRequest) {
  const authorizationError = await authorizeFacebookReply(request);
  if (authorizationError) return authorizationError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const commentId = typeof payload.commentId === 'string' ? payload.commentId : '';
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';
  const graphCommentId = commentId.startsWith('fb-live-') ? commentId.slice('fb-live-'.length) : '';

  if (!graphCommentId || graphCommentId.length > 100 || !/^[A-Za-z0-9_.-]+$/.test(graphCommentId)) {
    return NextResponse.json({ error: 'Ce commentaire Facebook ne peut pas recevoir de réponse.' }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: 'Saisissez une réponse avant de la publier.' }, { status: 400 });
  }
  if (message.length > 8000) {
    return NextResponse.json({ error: 'La réponse dépasse la limite de 8 000 caractères.' }, { status: 400 });
  }

  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: 'Le token d’accès de la Page Facebook n’est pas configuré.' }, { status: 503 });
  }

  const graphVersion = process.env.FACEBOOK_GRAPH_API_VERSION || 'v23.0';
  const replyParams = new URLSearchParams({ message, access_token: accessToken });

  try {
    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(graphCommentId)}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: replyParams,
        cache: 'no-store',
      },
    );
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const errorCode = result?.error?.code;
      if (errorCode === 190) {
        return NextResponse.json(
          { error: 'Le token Facebook est invalide ou expiré. Renouvelez le token de la Page.' },
          { status: 401 },
        );
      }
      if (errorCode === 10 || errorCode === 200) {
        return NextResponse.json(
          { error: 'Le token ne permet pas de répondre à ce commentaire. Vérifiez pages_manage_engagement.' },
          { status: 403 },
        );
      }
      if (errorCode === 100) {
        return NextResponse.json(
          { error: 'Facebook ne trouve pas ce commentaire ou n’autorise pas de réponse à celui-ci.' },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: `Facebook a refusé la réponse (HTTP ${response.status}${Number.isInteger(errorCode) ? `, code ${errorCode}` : ''}).` },
        { status: 502 },
      );
    }

    if (typeof result?.id !== 'string') {
      return NextResponse.json({ error: 'Facebook n’a pas confirmé la publication de la réponse.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, replyId: result.id });
  } catch {
    return NextResponse.json({ error: 'Impossible de joindre Facebook pour publier la réponse.' }, { status: 502 });
  }
}

// Ingestion par Webhook ou publication manuelle d'un commentaire capturé
async function siteAuditedPOST(req: NextRequest) {
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

export const PATCH = withSiteAudit("Réponse à un commentaire de veille", siteAuditedPATCH);
export const POST = withSiteAudit("Action de veille de réputation", siteAuditedPOST);
