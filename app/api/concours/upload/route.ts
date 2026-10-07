import { NextRequest } from 'next/server';
import { authorizeStaffRequest, deleteStaffFile, uploadStaffFiles } from '@/lib/staff-storage';

const BUCKET = 'concours-docs';

export async function POST(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'Accès non autorisé pour les documents de concours.');
  if (auth.error) return auth.error;
  return uploadStaffFiles(request, BUCKET, 'concours');
}

export async function DELETE(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'Accès non autorisé pour les documents de concours.');
  if (auth.error) return auth.error;
  return deleteStaffFile(request, BUCKET);
}
