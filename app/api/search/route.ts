import { NextRequest, NextResponse } from 'next/server';
import { strapi } from '@/lib/strapi';

function buildSearchPath(collection: 'formations' | 'actualites', query: string) {
  const params = new URLSearchParams({
    'filters[title][$containsi]': query,
    'fields[0]': 'title',
    'fields[1]': 'name',
    'fields[2]': 'description',
  });

  return `/${collection}?${params.toString()}`;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() || '';
  if (!query) return NextResponse.json({ data: [] });

  try {
    const [formations, actualites] = await Promise.all([
      strapi(buildSearchPath('formations', query)),
      strapi(buildSearchPath('actualites', query)),
    ]);

    return NextResponse.json({ formations, actualites });
  } catch {
    return NextResponse.json({ error: 'Recherche indisponible' }, { status: 502 });
  }
}
