import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { NextRequest } from 'next/server';

export function hasValidNewsletterCronSecret(request: NextRequest, secret: string) {
  const authorization = request.headers.get('authorization') || '';
  const provided = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const expectedBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer);
}
