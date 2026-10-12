import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest } from 'next/server';
import { authorizeStaffRequest, deleteStaffFile, uploadStaffFiles } from '@/lib/staff-storage';

const BUCKET = 'concours-docs';

async function siteAuditedPOST(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'concours', 'Accès non autorisé pour les documents de concours.');
  if (auth.error) return auth.error;
  return uploadStaffFiles(request, BUCKET, 'concours');
}

async function siteAuditedDELETE(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'concours', 'Accès non autorisé pour les documents de concours.');
  if (auth.error) return auth.error;
  return deleteStaffFile(request, BUCKET);
}

export const POST = withSiteAudit("Ajout de pièce jointe de concours", siteAuditedPOST);
export const DELETE = withSiteAudit("Suppression de pièce jointe de concours", siteAuditedDELETE);
