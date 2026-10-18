import { NextRequest, NextResponse } from 'next/server';
import { sendWeeklyTechDigest } from '@/lib/newsletter';
import { hasValidNewsletterCronSecret } from '@/lib/newsletter-cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const secret = process.env.NEWSLETTER_CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'La clé de planification de la newsletter n’est pas configurée.' },
      { status: 503 },
    );
  }
  if (!hasValidNewsletterCronSecret(request, secret)) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  }

  try {
    const result = await sendWeeklyTechDigest();
    const status = result.status === 'not_configured' || result.status === 'failed'
      ? 503
      : result.status === 'not_friday'
        ? 409
        : 200;
    return NextResponse.json(result, { status, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error(
      'Erreur inattendue lors de la revue hebdomadaire:',
      error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    );
    return NextResponse.json(
      { error: 'Impossible de générer ou d’envoyer la revue hebdomadaire.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
