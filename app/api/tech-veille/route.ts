import { NextResponse } from 'next/server';

const DEFAULT_TECH_ITEMS = [
  {
    id: 'live-1',
    title: 'OpenAI annonce GPT-5 et de nouvelles avancées majeures en raisonnement autonome',
    summary: 'La recherche mondiale en intelligence artificielle franchit un nouveau cap décisif avec l’automatisation des agents complexes.',
    source: 'Tech Community / AI News',
    url: 'https://openai.com/news',
    domain: 'IA' as const,
    date: 'En direct',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'live-2',
    title: 'PostgreSQL 17 : Performances inégalées pour les bases de données d’entreprise et cloud',
    summary: 'Optimisations massives sur la réplication, la gestion de la mémoire vive et le traitement des requêtes distribuées.',
    source: 'PostgreSQL Global Development Group',
    url: 'https://www.postgresql.org/about/news/',
    domain: 'Base de données' as const,
    date: 'Aujourd’hui',
    coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'live-3',
    title: 'Node.js 23 et TypeScript natif : L’ère des microservices ultra-rapides',
    summary: 'Découvrez les benchmarks de vitesse d’exécution et le support natif des modules ES pour le développement backend moderne.',
    source: 'Dev.to / Node.js',
    url: 'https://dev.to',
    domain: 'Développement' as const,
    date: 'Aujourd’hui',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'live-4',
    title: 'Wi-Fi 7 et Fibre 50G-PON : La nouvelle frontière des réseaux de télécommunication',
    summary: 'Analyse des infrastructures réseau haute vitesse et réduction de la latence pour les universités et entreprises.',
    source: 'IEEE Spectrum / Telecom News',
    url: 'https://www.networkworld.com',
    domain: 'Réseaux' as const,
    date: 'Hier',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
  },
];

export async function GET() {
  try {
    const res = await fetch('https://dev.to/api/articles?per_page=12&tag=ai,python,database,devops,javascript,security', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, items: DEFAULT_TECH_ITEMS });
    }

    const articles = await res.json();
    const formatted = Array.isArray(articles) && articles.length > 0
      ? articles.map((art: any, index: number) => {
          const tags = Array.isArray(art.tag_list) ? art.tag_list : [];
          let domain: 'IA' | 'Base de données' | 'Développement' | 'Réseaux' = 'Développement';
          if (tags.some((t: string) => /ai|artificial|gpt|llm|ml|openai|deepseek|claude/i.test(t))) domain = 'IA';
          else if (tags.some((t: string) => /sql|postgres|database|mongo|db|redis/i.test(t))) domain = 'Base de données';
          else if (tags.some((t: string) => /network|cloud|security|wifi|devops|linux/i.test(t))) domain = 'Réseaux';

          return {
            id: String(art.id || index),
            title: art.title || 'Actualité IT',
            summary: art.description || art.title || '',
            source: art.user?.name ? `Dev.to • ${art.user.name}` : 'Tech Community',
            url: art.url || 'https://dev.to',
            domain,
            date: new Date(art.published_at || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
            coverImage: art.cover_image || art.social_image || '',
          };
        })
      : DEFAULT_TECH_ITEMS;

    return NextResponse.json({ success: true, items: formatted });
  } catch (error) {
    console.error('Tech veille fetch error:', error);
    return NextResponse.json({ success: true, items: DEFAULT_TECH_ITEMS });
  }
}
