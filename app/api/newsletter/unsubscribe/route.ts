import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { getPostgresPool } from '@/lib/postgres';

function unsubscribePage(token: string, message: string) {
  return new NextResponse(
    `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Désabonnement newsletter INPTIC</title><body style="font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:40px 16px"><main style="max-width:520px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px"><h1 style="font-size:24px">Newsletter INPTIC</h1><p>${message}</p>${token ? `<form method="post"><input type="hidden" name="token" value="${token}"><button style="padding:12px 18px;background:#1d4ed8;color:#fff;border:0;border-radius:8px;font-weight:bold" type="submit">Confirmer le désabonnement</button></form>` : ''}</main></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    return unsubscribePage('', 'Le lien de désabonnement est invalide ou incomplet.');
  }

  return unsubscribePage(token, 'Confirmez que vous ne souhaitez plus recevoir les actualités de l’INPTIC.');
}

async function siteAuditedPOST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return unsubscribePage('', 'Le service est temporairement indisponible. Veuillez réessayer plus tard.');
  }

  const formData = await request.formData().catch(() => null);
  const token = formData?.get('token');
  if (typeof token !== 'string' || !/^[0-9a-f-]{36}$/i.test(token)) {
    return unsubscribePage('', 'Le lien de désabonnement est invalide ou incomplet.');
  }

  try {
    const { rows } = await getPostgresPool().query(
      `UPDATE public.subscribers
       SET is_active = FALSE
       WHERE unsubscribe_token = $1 AND is_active = TRUE
       RETURNING email`,
      [token],
    );
    return unsubscribePage('', rows.length ? 'Votre adresse a été désabonnée de la newsletter.' : 'Cette adresse est déjà désabonnée ou le lien n’est plus valide.');
  } catch (error) {
    console.error('Erreur de désabonnement newsletter:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return unsubscribePage('', 'Le service est temporairement indisponible. Veuillez réessayer plus tard.');
  }
}

export const POST = withSiteAudit("Désabonnement de la newsletter", siteAuditedPOST);
