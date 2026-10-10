import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest } from 'next/server';
import { authorizeStaffRequest, deleteStaffFile, uploadStaffFiles } from '@/lib/staff-storage';

const BUCKET = 'publications-docs';

async function siteAuditedPOST(request: NextRequest) {
  const auth = await authorizeStaffRequest(
    request,
    'publications',
    'Accès non autorisé pour les pièces jointes de publications.'
  );
  if (auth.error) return auth.error;
  return uploadStaffFiles(request, BUCKET, 'publications');
}

async function siteAuditedDELETE(request: NextRequest) {
  const auth = await authorizeStaffRequest(
    request,
    'publications',
    'Accès non autorisé pour les pièces jointes de publications.'
  );
  if (auth.error) return auth.error;
  return deleteStaffFile(request, BUCKET);
}

export const POST = withSiteAudit("Ajout de fichier de publication", siteAuditedPOST);
export const DELETE = withSiteAudit("Suppression de fichier de publication", siteAuditedDELETE);
