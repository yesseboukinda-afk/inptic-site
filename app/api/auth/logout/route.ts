import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, revokeAuthSession } from '@/lib/postgres-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  await revokeAuthSession(request);
  const response = NextResponse.json({ success: true });
  clearAuthCookie(response);
  return response;
}
