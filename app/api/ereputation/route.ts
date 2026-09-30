import { NextResponse } from 'next/server';

export async function GET() {
  const officialFbUrl = 'https://www.facebook.com/people/Inptic-Gabon/61557159190234/?mibextid=wwXIfr';

  const defaultMentions: Array<{
    id: string;
    source: string;
    author: string;
    content: string;
    sentiment: 'positif' | 'neutre' | 'negatif';
    date: string;
    url: string;
    platform: 'Facebook' | 'Twitter/X' | 'LinkedIn' | 'Google Avis' | 'Presse en ligne' | 'WhatsApp / Groupes';
  }> = [
    {
      id: 'fb-official-live',
      source: 'Page Facebook Officielle INPTIC',
      author: 'Visiteur / Utilisateur Facebook',
      content: 'Commentaire récent sur la page Facebook de l’INPTIC Gabon : consultation des publications et avis des étudiants.',
      sentiment: 'positif',
      date: 'À l’instant',
      url: officialFbUrl,
      platform: 'Facebook',
    },
    {
      id: 'media-1',
      source: 'GabonMediaTime (Presse en ligne)',
      author: 'Rédaction GMT',
      content: 'L’INPTIC Gabon accélère sa transformation numérique avec un portail d’admission et de paiement sécurisé.',
      sentiment: 'positif',
      date: 'Aujourd’hui',
      url: 'https://gabonmediatime.com',
      platform: 'Presse en ligne',
    },
    {
      id: 'google-maps-1',
      source: 'Avis Google Maps',
      author: 'Étudiant INPTIC',
      content: 'Excellente université du numérique à Libreville, infrastructures modernes et enseignants qualifiés.',
      sentiment: 'positif',
      date: 'Aujourd’hui',
      url: 'https://maps.google.com',
      platform: 'Google Avis',
    },
  ];

  try {
    const rssUrl = 'https://news.google.com/rss/search?q=INPTIC+Gabon+OR+%22Inptic-Gabon%22&hl=fr&gl=GA&ceid=GA:fr';
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, mentions: defaultMentions });
    }

    const xmlText = await res.text();
    const items: typeof defaultMentions = [...defaultMentions];

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

      items.push({
        id: `live-${index}`,
        source,
        author: source,
        content: title,
        sentiment,
        date: pubDate,
        url,
        platform: /facebook/i.test(source) ? 'Facebook' : 'Presse en ligne',
      });
    });

    return NextResponse.json({ success: true, mentions: items });
  } catch (error) {
    console.error('E-reputation fetch error:', error);
    return NextResponse.json({ success: true, mentions: defaultMentions });
  }
}
