import { withSiteAudit } from '@/lib/site-audit';
import { getChatbotFile, getChatbotFileMetadata, isChatbotFileFormat } from '@/lib/chatbot-files';
import { NextRequest, NextResponse } from 'next/server';
import { getDocument, listDocuments, saveDocument, type DocumentKind } from '@/lib/chatbot-db';

export async function GET(request: NextRequest) {
  const documentId = request.nextUrl.searchParams.get('id');
  if (documentId) {
    const document = getDocument(documentId);
    if (document && request.nextUrl.searchParams.get('download') === '1') {
      const requestedFormat = request.nextUrl.searchParams.get('format');
      if (isChatbotFileFormat(requestedFormat)) {
        const metadata = getChatbotFileMetadata(requestedFormat);
        const bytes = getChatbotFile(requestedFormat, document.content);
        const file = new ArrayBuffer(bytes.byteLength);
        new Uint8Array(file).set(bytes);
        const filename = `${document.title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ').trim() || 'document'}.${metadata.extension}`;
        return new Response(file, {
          headers: {
            'Content-Type': metadata.contentType,
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }
      if (requestedFormat) {
        return NextResponse.json({ error: 'Format de fichier non pris en charge.' }, { status: 400 });
      }
      const filename = `${document.title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ').trim() || 'document'}.md`;
      return new Response(document.content, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
          'Cache-Control': 'private, no-store',
        },
      });
    }
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
