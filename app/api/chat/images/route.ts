import { getGeneratedImage } from '@/lib/chatbot-db';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const imageId = request.nextUrl.searchParams.get('id');
  if (!imageId) {
    return NextResponse.json({ error: 'Image introuvable.' }, { status: 404 });
  }

  const image = getGeneratedImage(imageId);
  if (!image) {
    return NextResponse.json({ error: 'Image introuvable.' }, { status: 404 });
  }
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'].includes(image.mimeType)) {
    return NextResponse.json({ error: 'Format d’image non pris en charge.' }, { status: 415 });
  }

  const download = request.nextUrl.searchParams.get('download') === '1';
  const imageData = new ArrayBuffer(image.imageData.byteLength);
  new Uint8Array(imageData).set(image.imageData);
  const extension = image.mimeType === 'image/svg+xml'
    ? 'svg'
    : image.mimeType === 'image/jpeg' ? 'jpg' : image.mimeType === 'image/webp' ? 'webp' : 'png';
  return new Response(imageData, {
    headers: {
      'Content-Type': image.mimeType === 'image/svg+xml' ? 'image/svg+xml; charset=utf-8' : image.mimeType,
      'Content-Length': String(image.imageData.byteLength),
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      ...(image.mimeType === 'image/svg+xml' ? { 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox" } : {}),
      ...(download ? { 'Content-Disposition': `attachment; filename="sohane-image.${extension}"` } : {}),
    },
  });
}
