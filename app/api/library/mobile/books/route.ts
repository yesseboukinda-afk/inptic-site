import { getMobileLibraryBooks } from '@/lib/library-mobile';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const books = await getMobileLibraryBooks({
      type: request.nextUrl.searchParams.get('type') || undefined,
      limit: Number(request.nextUrl.searchParams.get('limit')) || 10,
    });
    return NextResponse.json(books, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch (error) {
    console.error('[Library mobile API] Book listing failed:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de récupérer les ouvrages.' }, { status: 503 });
  }
}
