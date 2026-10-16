import { withSiteAudit } from '@/lib/site-audit';
import { getAuthenticatedUser } from '@/lib/postgres-auth';
import { getPostgresPool } from '@/lib/postgres';
import { isSuperAdminRole } from '@/lib/roles';
import {
  AI_PROVIDER_DEFAULTS,
  decodeApiKey,
  encodeApiKey,
  getEnvironmentApiKey,
  getPublicAIProviderSettings,
  isAIProvider,
  listAIProviderSettings,
  testAIProviderConnection,
} from '@/lib/ai-provider-settings';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireSuperAdmin(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: 'Session requise.' }, { status: 401 }) };
  }
  if (!isSuperAdminRole(user.role)) {
    return { error: NextResponse.json({ error: 'Accès réservé au superadmin.' }, { status: 403 }) };
  }
  return { user };
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) return auth.error;

  try {
    const rows = await listAIProviderSettings();
    if (!rows) {
      return NextResponse.json(
        { error: 'La table de configuration IA est absente. Exécutez scripts/19_create_ai_provider_settings.sql.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return NextResponse.json(
      { providers: getPublicAIProviderSettings(rows) },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    console.error('[Admin AI settings GET] PostgreSQL error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json(
      { error: 'Impossible de charger la configuration IA.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

async function siteAuditedPOST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) return auth.error;

  let body: { provider?: unknown; model?: unknown; apiKey?: unknown; thinkingEnabled?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête JSON invalide.' }, { status: 400 });
  }

  if (!isAIProvider(body.provider)) {
    return NextResponse.json({ error: 'Fournisseur IA invalide.' }, { status: 400 });
  }
  const provider = body.provider;
  const model = typeof body.model === 'string' ? body.model.trim() : '';
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,119}$/.test(model)) {
    return NextResponse.json({ error: 'Nom de modèle invalide.' }, { status: 400 });
  }
  if (body.apiKey !== undefined && (typeof body.apiKey !== 'string' || body.apiKey.length > 512)) {
    return NextResponse.json({ error: 'Clé API invalide.' }, { status: 400 });
  }
  if (body.thinkingEnabled !== undefined && typeof body.thinkingEnabled !== 'boolean') {
    return NextResponse.json({ error: 'Option de réflexion invalide.' }, { status: 400 });
  }

  try {
    const pool = getPostgresPool();
    const existing = await pool.query<{ api_key_encrypted: string | null }>(
      'SELECT api_key_encrypted FROM public.ai_provider_settings WHERE provider = $1',
      [provider],
    );
    const apiKey = typeof body.apiKey === 'string' && body.apiKey.trim()
      ? body.apiKey.trim()
      : existing.rows[0]?.api_key_encrypted
        ? decodeApiKey(existing.rows[0].api_key_encrypted)
        : getEnvironmentApiKey(provider);

    if (AI_PROVIDER_DEFAULTS[provider].keyRequired && !apiKey) {
      return NextResponse.json(
        { error: `Saisissez une clé API pour ${AI_PROVIDER_DEFAULTS[provider].label}.` },
        { status: 400 },
      );
    }

    const test = await testAIProviderConnection({
      provider,
      model,
      apiKey,
      thinkingEnabled: body.thinkingEnabled === true,
    });
    if (!test.online) {
      return NextResponse.json({ error: test.message, test }, { status: 502 });
    }

    const encryptedApiKey = typeof body.apiKey === 'string' && body.apiKey.trim()
      ? encodeApiKey(apiKey)
      : existing.rows[0]?.api_key_encrypted || (apiKey ? encodeApiKey(apiKey) : null);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE public.ai_provider_settings SET is_active = FALSE WHERE is_active = TRUE');
      await client.query(
        `INSERT INTO public.ai_provider_settings
           (provider, model, api_key_encrypted, thinking_enabled, is_active, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, TRUE, $5, NOW())
         ON CONFLICT (provider) DO UPDATE
         SET model = EXCLUDED.model,
             api_key_encrypted = COALESCE(EXCLUDED.api_key_encrypted, public.ai_provider_settings.api_key_encrypted),
             thinking_enabled = EXCLUDED.thinking_enabled,
             is_active = TRUE,
             updated_by = EXCLUDED.updated_by,
             updated_at = NOW()`,
        [provider, model, encryptedApiKey, body.thinkingEnabled === true, auth.user.id],
      );
      await client.query('COMMIT');
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('[Admin AI settings POST] Transaction rollback failed:', rollbackError);
      }
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json(
      { success: true, message: test.message, provider, model },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[Admin AI settings POST] Configuration error:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Impossible d’enregistrer la configuration IA.' },
      { status: 503 },
    );
  }
}

export const POST = withSiteAudit('Test et modification de la configuration IA', siteAuditedPOST);
