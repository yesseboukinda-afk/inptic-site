import { NextRequest, NextResponse } from 'next/server';
import { authorizeStaffRequest, uploadStaffFiles } from '@/lib/staff-storage';

const BUCKET = 'formations-catalogue';

export async function POST(request: NextRequest) {
  const auth = await authorizeStaffRequest(request, 'Accès réservé à l’administration des formations.');
  if (auth.error) return auth.error;

  const formData = await request.clone().formData();
  const kind = formData.get('kind');
  const files = formData.getAll('files').filter((value): value is File => value instanceof File);
  if (files.length !== 1) return NextResponse.json({ error: 'Téléversez un seul fichier.' }, { status: 400 });

  const file = files[0];
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validType = kind === 'pdf'
    ? extension === 'pdf'
    : kind === 'video' && ['mp4', 'webm'].includes(extension || '');
  if (!validType || file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: 'Formats acceptés : PDF, MP4 ou WebM (15 Mo maximum).' }, { status: 400 });
  }

  return uploadStaffFiles(request, BUCKET, 'catalogue');
}