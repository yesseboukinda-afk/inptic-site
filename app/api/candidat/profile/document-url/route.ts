import { NextRequest, NextResponse } from 'next/server';
import { readStoredPrivateFile } from '@/lib/localStorage';
import { getProfileDocumentPrefix } from '@/lib/documentStorage';
import { getPostgresPool } from '@/lib/postgres';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { isAdminRole, isCommunicationRole, isDirectorRole, normalizeRole } from '@/lib/roles';

const DOCUMENT_BUCKET = 'candidate-documents';

function canManageCandidateProfiles(role: string) {
  const normalizedRole = normalizeRole(role);
  return isAdminRole(normalizedRole) ||
    isDirectorRole(normalizedRole) ||
    isCommunicationRole(normalizedRole) ||
    ['scolarite', 'direction_etudes', 'rh_admin', 'rh_gestionnaire'].includes(normalizedRole);
}

async function validateDocumentAccess(request: NextRequest, emailValue: unknown, pathValue: unknown) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Session requise. Veuillez vous connecter.' }, { status: 401 }) };
  }
  if (typeof emailValue !== 'string' || typeof pathValue !== 'string') {
    return { error: NextResponse.json({ error: 'Adresse courriel et chemin de document requis.' }, { status: 400 }) };
  }

  const email = emailValue.trim().toLowerCase();
  const path = pathValue;
  if (!email || !path.startsWith(getProfileDocumentPrefix(email))) {
    return { error: NextResponse.json({ error: 'Chemin de document invalide.' }, { status: 400 }) };
  }
  if (!canManageCandidateProfiles(user.role) && email !== user.email) {
    return { error: NextResponse.json({ error: 'Vous ne pouvez consulter que vos propres documents.' }, { status: 403 }) };
  }

  const result = await getPostgresPool().query(
    `SELECT 1 FROM public.profiles
     WHERE email = $1 AND documents @> $2::jsonb
     LIMIT 1`,
    [email, JSON.stringify([{ path }])],
  );
  if (!result.rowCount) {
    return { error: NextResponse.json({ error: 'Document introuvable pour ce candidat.' }, { status: 404 }) };
  }

  return { email, path };
}

export async function POST(request: NextRequest) {
  let body: { email?: unknown; path?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  try {
    const access = await validateDocumentAccess(request, body.email, body.path);
    if ('error' in access) return access.error;
    const params = new URLSearchParams({ email: access.email, path: access.path });
    return NextResponse.json({
      url: `/api/candidat/profile/document-url?${params.toString()}`,
      expiresIn: null,
    });
  } catch (error) {
    console.error('Erreur PostgreSQL lors de la vérification du document candidat:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Impossible de vérifier le document candidat.' }, { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const access = await validateDocumentAccess(
      request,
      request.nextUrl.searchParams.get('email'),
      request.nextUrl.searchParams.get('path'),
    );
    if ('error' in access) return access.error;

    const file = await readStoredPrivateFile(DOCUMENT_BUCKET, access.path);
    if (!file) return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 });
    return new NextResponse(file.contents, {
      headers: {
        'Content-Type': file.metadata.mime_type,
        'Content-Length': String(file.metadata.byte_size),
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.metadata.original_filename)}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Erreur de lecture du document candidat:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json({ error: 'Document candidat indisponible.' }, { status: 503 });
  }
}
