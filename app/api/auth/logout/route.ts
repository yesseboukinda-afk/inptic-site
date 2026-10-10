import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, revokeAuthSession } from '@/lib/postgres-auth';

export const runtime = 'nodejs';

async function siteAuditedPOST(request: NextRequest) {
  await revokeAuthSession(request);
  const response = NextResponse.json({ success: true });
  clearAuthCookie(response);
  return response;
}

export const POST = withSiteAudit("Déconnexion", siteAuditedPOST);
