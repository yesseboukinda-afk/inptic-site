import { withSiteAudit } from '@/lib/site-audit';
import { NextRequest, NextResponse } from 'next/server';
import { getDocument, listDocuments, saveDocument, type DocumentKind } from '@/lib/chatbot-db';

export async function GET(request: NextRequest) {
  const documentId = request.nextUrl.searchParams.get('id');
  if (documentId) {
    const document = getDocument(documentId);
    return document
      ? NextResponse.json(document)
      : NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  return NextResponse.json(listDocuments());
}

async function siteAuditedPOST(request: NextRequest) {
  try {
    const body = await request.json();
    if (
      typeof body?.title !== 'string' ||
      typeof body?.content !== 'string' ||
      !['text', 'code', 'sheet'].includes(body?.kind)
    ) {
      return NextResponse.json({ error: 'Document invalide' }, { status: 400 });
    }

    const document = saveDocument({
      id: typeof body.id === 'string' ? body.id : undefined,
      title: body.title,
      kind: body.kind as DocumentKind,
      content: body.content,
    });
    return NextResponse.json(document);
  } catch {
    return NextResponse.json({ error: 'Impossible de sauvegarder le document' }, { status: 400 });
  }
}

export const POST = withSiteAudit("Création ou modification de document assistant", siteAuditedPOST);
