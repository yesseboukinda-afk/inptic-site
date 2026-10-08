import { NextRequest } from 'next/server';
import { authorizeStaffRequest, deleteStaffFile, uploadStaffFiles } from '@/lib/staff-storage';

const BUCKET = 'publications-docs';

export async function POST(request: NextRequest) {
  const auth = await authorizeStaffRequest(
    request,
    'publications',
    'Accès non autorisé pour les pièces jointes de publications.'
  );
  if (auth.error) return auth.error;
  return uploadStaffFiles(request, BUCKET, 'publications');
}

export async function DELETE(request: NextRequest) {
  const auth = await authorizeStaffRequest(
    request,
    'publications',
    'Accès non autorisé pour les pièces jointes de publications.'
  );
  if (auth.error) return auth.error;
  return deleteStaffFile(request, BUCKET);
}
