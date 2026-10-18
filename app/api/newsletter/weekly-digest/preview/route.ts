import { NextResponse } from 'next/server';
import { previewWeeklyTechDigest } from '@/lib/newsletter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const preview = await previewWeeklyTechDigest();
    const page = `<!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Aperçu de la revue IT hebdomadaire INPTIC</title>
        </head>
        <body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif">
          <main style="max-width:760px;margin:0 auto;padding:20px">
            <div style="margin:0 0 16px;padding:14px 18px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#334155;font-size:13px">
              <strong>Édition du ${preview.weekOf} · ${preview.articleCount} article(s)</strong>
              <span style="display:block;margin-top:6px">Aperçu navigateur uniquement — aucun e-mail n’est envoyé. ${preview.sourceFailures} flux indisponible(s).</span>
            </div>
            <div style="background:#fff;border-radius:12px">${preview.html}</div>
          </main>
        </body>
      </html>`;
    return new NextResponse(page, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error(
      'Erreur de génération de l’aperçu de la revue hebdomadaire:',
      error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    );
    return NextResponse.json(
      { error: 'Impossible de générer l’aperçu de la revue hebdomadaire.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
