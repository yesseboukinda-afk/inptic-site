import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import { isSuperAdminRole } from '@/lib/roles';
import {
  decodeApiKey,
  getEnvironmentApiKey,
  isAIProvider,
  listAIProviderModels,
} from '@/lib/ai-provider-settings';
import { NextRequest, NextResponse } from 'next/server';
import { safeClientErrorMessage, sanitizeSecrets } from '@/lib/security-sanitize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Session requise.' }, { status: 401 });
  if (!isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: 'Accès réservé au superadmin.' }, { status: 403 });
  }

  let body: { provider?: unknown; apiKey?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête JSON invalide.' }, { status: 400 });
  }
  if (!isAIProvider(body.provider)) {
    return NextResponse.json({ error: 'Fournisseur IA invalide.' }, { status: 400 });
  }
  if (body.apiKey !== undefined && (typeof body.apiKey !== 'string' || body.apiKey.length > 512)) {
    return NextResponse.json({ error: 'Clé API invalide.' }, { status: 400 });
  }

  const provider = body.provider;
  let apiKey: string;
  try {
    const saved = await getPostgresPool().query<{ api_key_encrypted: string | null }>(
      'SELECT api_key_encrypted FROM public.ai_provider_settings WHERE provider = $1',
      [provider],
    );
    apiKey = typeof body.apiKey === 'string' && body.apiKey.trim()
      ? body.apiKey.trim()
      : decodeApiKey(saved.rows[0]?.api_key_encrypted || null) || getEnvironmentApiKey(provider);
  } catch (error) {
    console.error('[Admin AI models] Configuration lookup failed:', error instanceof Error ? sanitizeSecrets(error.message) : 'UNKNOWN_ERROR');
    return NextResponse.json(
      { error: 'Impossible de lire la configuration du fournisseur. Vérifiez les permissions PostgreSQL.' },
      { status: 503 },
    );
  }

  try {
    const models = await listAIProviderModels(provider, apiKey);
    return NextResponse.json({ models }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[Admin AI models] Model listing failed:', error instanceof Error ? sanitizeSecrets(error.message) : 'UNKNOWN_ERROR');
    return NextResponse.json(
      { error: safeClientErrorMessage(error, 'Impossible de charger la liste des modèles pour ce fournisseur.') },
      { status: 503 },
    );
  }
}
