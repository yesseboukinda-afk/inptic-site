import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://dev.to/api/articles?per_page=12&tag=ai,python,database,devops,javascript,security', {
      headers: { 'User-Agent': 'INPTIC-Tech-Watch' },
      next: { revalidate: 1800 },
    });

    if (!res.ok) throw new Error('Failed to fetch tech articles');

    const articles = await res.json();
    const formatted = Array.isArray(articles)
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
      : [];

    return NextResponse.json({ success: true, items: formatted });
  } catch (error) {
    console.error('Tech veille fetch error:', error);
    return NextResponse.json({
      success: false,
      items: [
        {
          id: 'fallback-1',
          title: 'OpenAI annonce de nouvelles avancées en raisonnement IA et agents autonomes',
          summary: 'La recherche mondiale en intelligence artificielle franchit une nouvelle étape avec des modèles multimodaux ultra-rapides.',
          source: 'Tech Community / AI News',
          url: 'https://dev.to',
          domain: 'IA',
          date: 'En direct',
          coverImage: '',
        },
      ],
    });
  }
}
