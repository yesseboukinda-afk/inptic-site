import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rssUrl = 'https://news.google.com/rss/search?q=INPTIC+Gabon&hl=fr&gl=GA&ceid=GA:fr';
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'INPTIC-E-Reputation-Bot' },
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error('Failed to fetch RSS news');

    const xmlText = await res.text();
    const items: Array<{
      id: string;
      source: string;
      author: string;
      content: string;
      sentiment: 'positif' | 'neutre' | 'negatif';
      date: string;
      url: string;
      platform: 'Facebook' | 'Twitter/X' | 'LinkedIn' | 'Google Avis' | 'Presse en ligne';
    }> = [];

    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || [];

    itemMatches.slice(0, 10).forEach((itemXml, index) => {
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
      if (/excellence|succ[èe]s|lance|innovation|belle|victoire|reconnaissance|prog[rè]س|numerique|technologie/i.test(lower)) {
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
        platform: 'Presse en ligne',
      });
    });

    return NextResponse.json({ success: true, mentions: items });
  } catch (error) {
    console.error('E-reputation fetch error:', error);
    return NextResponse.json({ success: false, mentions: [] });
  }
}
