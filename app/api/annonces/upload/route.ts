import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import {
  authorizeStaffRequest,
  deleteStaffFile,
  uploadStaffFiles,
} from '@/lib/staff-storage';

const BUCKET = 'annonces-attachments';

async function siteAuditedPOST(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'announcements', 'Accès réservé aux administrateurs ou au responsable communication.');
  if (auth.error) return auth.error;
  return uploadStaffFiles(request, BUCKET, 'annonces');
}

async function siteAuditedDELETE(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'announcements', 'Accès réservé aux administrateurs ou au responsable communication.');
  if (auth.error) return auth.error;
  return deleteStaffFile(request, BUCKET);
}

export const POST = withSiteAudit("Ajout de fichier d’annonce", siteAuditedPOST);
export const DELETE = withSiteAudit("Suppression de fichier d’annonce", siteAuditedDELETE);
