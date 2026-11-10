import { getMobileLibraryBooks } from '@/lib/library-mobile';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const books = await getMobileLibraryBooks({
      query: request.nextUrl.searchParams.get('q') || undefined,
      category: request.nextUrl.searchParams.get('categorie') || undefined,
      language: request.nextUrl.searchParams.get('langue') || undefined,
      limit: 50,
    });
    return NextResponse.json(books, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch (error) {
    console.error('[Library mobile API] Search failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de rechercher les ouvrages.' }, { status: 503 });
  }
}
