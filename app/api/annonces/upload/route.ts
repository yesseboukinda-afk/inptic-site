import { NextRequest, NextResponse } from 'next/server';
import {
  authorizeStaffRequest,
  deleteStaffFile,
  uploadStaffFiles,
} from '@/lib/staff-storage';

const BUCKET = 'annonces-attachments';

export async function POST(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'announcements', 'Accès réservé aux administrateurs ou au responsable communication.');
  if (auth.error) return auth.error;
  return uploadStaffFiles(request, BUCKET, 'annonces');
}

export async function DELETE(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'announcements', 'Accès réservé aux administrateurs ou au responsable communication.');
  if (auth.error) return auth.error;
  return deleteStaffFile(request, BUCKET);
}
