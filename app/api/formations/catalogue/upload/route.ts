import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { authorizeStaffRequest, uploadStaffFiles } from '@/lib/staff-storage';

const BUCKET = 'formations-catalogue';

async function siteAuditedPOST(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'formations', 'Accès réservé à l’administration des formations.');
  if (auth.error) return auth.error;

  return uploadStaffFiles(request, BUCKET, 'catalogue', {
    maxFileCount: 1,
    maxFileSizeBytes: 60 * 1024 * 1024,
    validateFile: (file, formData) => {
      const kind = formData.get('kind');
      const extension = file.name.split('.').pop()?.toLowerCase();
      const validPdf = kind === 'pdf' && extension === 'pdf' && (!file.type || file.type === 'application/pdf');
      const validVideo = kind === 'video' && ['mp4', 'webm'].includes(extension || '') &&
        (!file.type || file.type === `video/${extension}`);

      if (!validPdf && !validVideo) {
        return 'Formats acceptés : PDF, MP4 ou WebM.';
      }
      if (validVideo && file.size > 15 * 1024 * 1024) {
        return 'Les vidéos sont limitées à 15 Mo.';
      }
      return null;
    },
  });
}

export const POST = withSiteAudit("Ajout de ressource au catalogue de formation", siteAuditedPOST);
