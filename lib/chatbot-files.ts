import { strToU8, zipSync } from 'fflate';
import { createChatbotDocx } from '@/lib/chatbot-docx';

export type ChatbotFileFormat = 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'csv' | 'txt';

const XML_NS = {
  relationships: 'http://schemas.openxmlformats.org/package/2006/relationships',
  office: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  word: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  spreadsheet: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  presentation: 'http://schemas.openxmlformats.org/presentationml/2006/main',
  drawing: 'http://schemas.openxmlformats.org/drawingml/2006/main',
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function markdownRows(markdown: string) {
  return markdown.split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|') || /^\|[\s:|-]+\|$/.test(trimmed)) return [];
    return [trimmed.slice(1, -1).split('|').map((cell) => cell.trim().replace(/\*\*/g, ''))];
  });
}

function spreadsheetColumn(index: number) {
  let column = '';
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    column = String.fromCharCode(65 + ((value - 1) % 26)) + column;
  }
  return column;
}

function spreadsheetXml(markdown: string) {
  const rows = markdownRows(markdown);
  const contentRows = rows.length ? rows : markdown.split(/\r?\n/).filter(Boolean).map((line) => [line.replace(/^#{1,6}\s*/, '')]);
  const worksheetRows = contentRows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const style = rowIndex === 0 && rows.length ? ' s="1"' : '';
      return `<c r="${spreadsheetColumn(columnIndex)}${rowIndex + 1}" t="inlineStr"${style}><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
    }).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');
  const columns = Math.max(1, ...contentRows.map((row) => row.length));
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${XML_NS.spreadsheet}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols>${Array.from({ length: columns }, (_, index) => `<col min="${index + 1}" max="${index + 1}" width="28" customWidth="1"/>`).join('')}</cols><sheetData>${worksheetRows}</sheetData><autoFilter ref="A1:${spreadsheetColumn(columns - 1)}${Math.max(1, contentRows.length)}"/></worksheet>`;
}

function createXlsx(markdown: string) {
  const worksheet = spreadsheetXml(markdown);
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${XML_NS.spreadsheet}"><fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF174EA6"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>`;
  return zipSync({
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${XML_NS.relationships}"><Relationship Id="rId1" Type="${XML_NS.office}/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${XML_NS.spreadsheet}" xmlns:r="${XML_NS.office}"><sheets><sheet name="Sohane" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${XML_NS.relationships}"><Relationship Id="rId1" Type="${XML_NS.office}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${XML_NS.office}/styles" Target="styles.xml"/></Relationships>`),
    'xl/worksheets/sheet1.xml': strToU8(worksheet),
    'xl/styles.xml': strToU8(styles),
  });
}

function createPptx(markdown: string) {
  const slides: { title: string; lines: string[] }[] = [];
  let current = { title: 'Document Sohane', lines: [] as string[] };
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(/^#{1,2}\s+(.+)$/);
    if (heading && current.lines.length) {
      slides.push(current);
      current = { title: heading[1], lines: [] };
    } else if (heading) {
      current.title = heading[1];
    } else if (!/^#{3,6}\s/.test(line) && !/^\|[\s:|-]+\|$/.test(line)) {
      current.lines.push(line.replace(/^\|/, '').replace(/\|$/, '').replace(/\|/g, '  •  ').replace(/^\s*[-*]\s+/, '• ').replace(/\*\*/g, ''));
    }
    if (current.lines.length >= 8) {
      slides.push(current);
      current = { title: slides[slides.length - 1].title, lines: [] };
    }
  }
  if (current.lines.length || !slides.length) slides.push(current);
  const presentationSlides = slides.slice(0, 40);
  const slideIds = presentationSlides.map((_, index) =>
    `<p:sldId id="${256 + index}" r:id="rId${index + 2}"/>`,
  ).join('');
  const presentationRelationships = presentationSlides.map((_, index) =>
    `<Relationship Id="rId${index + 2}" Type="${XML_NS.office}/slide" Target="slides/slide${index + 1}.xml"/>`,
  ).join('');
  const slideFiles: Record<string, Uint8Array> = {};
  const slideRelationshipFiles: Record<string, Uint8Array> = {};
  const slideOverrides = presentationSlides.map((_, index) =>
    `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
  ).join('');

  presentationSlides.forEach((slide, index) => {
    const paragraphs = [
      `<a:p><a:pPr/><a:r><a:rPr lang="fr-FR" sz="2800" b="1"><a:solidFill><a:srgbClr val="174EA6"/></a:solidFill></a:rPr><a:t>${escapeXml(slide.title.slice(0, 120))}</a:t></a:r><a:endParaRPr lang="fr-FR"/></a:p>`,
      ...slide.lines.slice(0, 10).map((line) => `<a:p><a:pPr marL="342900" indent="-228600"><a:buChar char="•"/></a:pPr><a:r><a:rPr lang="fr-FR" sz="1800"/><a:t>${escapeXml(line.slice(0, 300))}</a:t></a:r><a:endParaRPr lang="fr-FR"/></a:p>`),
    ].join('');
    slideFiles[`ppt/slides/slide${index + 1}.xml`] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="${XML_NS.drawing}" xmlns:r="${XML_NS.office}" xmlns:p="${XML_NS.presentation}"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:sp><p:nvSpPr><p:cNvPr id="2" name="Content"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="457200"/><a:ext cx="10668000" cy="5943600"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square" anchor="t"><a:spAutoFit/></a:bodyPr><a:lstStyle/>${paragraphs}</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`);
    slideRelationshipFiles[`ppt/slides/_rels/slide${index + 1}.xml.rels`] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${XML_NS.relationships}"><Relationship Id="rId1" Type="${XML_NS.office}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>`);
  });

  return zipSync({
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${slideOverrides}</Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${XML_NS.relationships}"><Relationship Id="rId1" Type="${XML_NS.office}/officeDocument" Target="ppt/presentation.xml"/></Relationships>`),
    'ppt/presentation.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="${XML_NS.drawing}" xmlns:r="${XML_NS.office}" xmlns:p="${XML_NS.presentation}"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slideIds}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="wide"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`),
    'ppt/_rels/presentation.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${XML_NS.relationships}"><Relationship Id="rId1" Type="${XML_NS.office}/slideMaster" Target="slideMasters/slideMaster1.xml"/>${presentationRelationships}</Relationships>`),
    'ppt/slideMasters/slideMaster1.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="${XML_NS.drawing}" xmlns:r="${XML_NS.office}" xmlns:p="${XML_NS.presentation}"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMap accent1="4F81BD" accent2="C0504D" accent3="9BBB59" accent4="8064A2" accent5="4BACC6" accent6="F79646" bg1="lt1" bg2="lt2" tx1="dk1" tx2="dk2" hlink="blue" folHlink="purple"/><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`),
    'ppt/slideMasters/_rels/slideMaster1.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${XML_NS.relationships}"><Relationship Id="rId1" Type="${XML_NS.office}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`),
    'ppt/slideLayouts/slideLayout1.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="${XML_NS.drawing}" xmlns:r="${XML_NS.office}" xmlns:p="${XML_NS.presentation}" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`),
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${XML_NS.relationships}"><Relationship Id="rId1" Type="${XML_NS.office}/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`),
    'ppt/theme/theme1.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="${XML_NS.drawing}" name="Sohane"><a:themeElements><a:clrScheme name="Sohane"><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="174EA6"/></a:dk2><a:lt2><a:srgbClr val="F3F6FB"/></a:lt2><a:accent1><a:srgbClr val="174EA6"/></a:accent1><a:accent2><a:srgbClr val="4BACC6"/></a:accent2><a:accent3><a:srgbClr val="70AD47"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="ED7D31"/></a:accent5><a:accent6><a:srgbClr val="A5A5A5"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Sohane"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme><a:fmtScheme name="Sohane"><a:fillStyleLst/><a:lnStyleLst/><a:effectStyleLst/><a:bgFillStyleLst/></a:fmtScheme></a:themeElements></a:theme>`),
    ...slideFiles,
    ...slideRelationshipFiles,
  });
}

function pdfText(value: string) {
  const normalized = value
    .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-')
    .replace(/•/g, '-').replace(/[^\x20-\x7e\u00a0-\u00ff]/g, '?');
  const bytes = Buffer.from(normalized, 'latin1');
  return `<${bytes.toString('hex').toUpperCase()}>`;
}

function createPdf(markdown: string) {
  const lines = markdown.split(/\r?\n/).flatMap((raw) => {
    const line = raw.trim().replace(/^#{1,6}\s*/, '').replace(/\*\*/g, '').replace(/`/g, '');
    if (!line) return [''];
    const words = line.startsWith('|') && line.endsWith('|')
      ? [line.slice(1, -1).replace(/\|/g, '  |  ')]
      : [line];
    return words.flatMap((word) => {
      const tokens = word.split(/\s+/);
      const wrapped: string[] = [];
      let current = '';
      for (const token of tokens) {
        const next = current ? `${current} ${token}` : token;
        if (next.length > 92 && current) {
          wrapped.push(current);
          current = token;
        } else current = next;
      }
      if (current) wrapped.push(current);
      return wrapped;
    });
  });
  const pageLines: string[][] = [];
  for (let index = 0; index < lines.length; index += 48) pageLines.push(lines.slice(index, index + 48));
  if (!pageLines.length) pageLines.push(['']);

  const objects: string[] = [];
  const addObject = (value: string) => {
    objects.push(value);
    return objects.length;
  };
  const catalogId = addObject('');
  const pagesId = addObject('');
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const pageIds: number[] = [];

  for (const page of pageLines) {
    const commands = ['BT', '/F1 11 Tf', '54 788 Td', '14 TL'];
    for (const line of page) {
      if (line) commands.push(`${pdfText(line)} Tj`);
      commands.push('T*');
    }
    commands.push('ET');
    const stream = Buffer.from(commands.join('\n'), 'ascii');
    const streamId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream.toString('ascii')}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${streamId} 0 R >>`);
    pageIds.push(pageId);
  }
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'binary')];
  const offsets = [0];
  let length = chunks[0].length;
  objects.forEach((object, index) => {
    offsets.push(length);
    const chunk = Buffer.from(`${index + 1} 0 obj\n${object}\nendobj\n`, 'binary');
    chunks.push(chunk);
    length += chunk.length;
  });
  const xrefOffset = length;
  const xref = [`xref\n0 ${objects.length + 1}\n`, '0000000000 65535 f \n'];
  for (let index = 1; index < offsets.length; index += 1) xref.push(`${String(offsets[index]).padStart(10, '0')} 00000 n \n`);
  xref.push(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  chunks.push(Buffer.from(xref.join(''), 'ascii'));
  return new Uint8Array(Buffer.concat(chunks));
}

export function getChatbotFile(format: ChatbotFileFormat, content: string): Uint8Array {
  switch (format) {
    case 'docx': return createChatbotDocx(content);
    case 'xlsx': return createXlsx(content);
    case 'pptx': return createPptx(content);
    case 'pdf': return createPdf(content);
    case 'csv': {
      const rows = markdownRows(content);
      const csvRows = rows.length ? rows : content.split(/\r?\n/).filter(Boolean).map((line) => [line.replace(/^#{1,6}\s*/, '')]);
      return new TextEncoder().encode(`\uFEFF${csvRows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';')).join('\r\n')}`);
    }
    case 'txt': return new TextEncoder().encode(content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'));
  }
}

export function getChatbotFileMetadata(format: ChatbotFileFormat) {
  const metadata: Record<ChatbotFileFormat, { extension: string; contentType: string; label: string }> = {
    docx: { extension: 'docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word' },
    xlsx: { extension: 'xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel' },
    pptx: { extension: 'pptx', contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', label: 'PowerPoint' },
    pdf: { extension: 'pdf', contentType: 'application/pdf', label: 'PDF' },
    csv: { extension: 'csv', contentType: 'text/csv; charset=utf-8', label: 'CSV' },
    txt: { extension: 'txt', contentType: 'text/plain; charset=utf-8', label: 'texte' },
  };
  return metadata[format];
}

export function isChatbotFileFormat(value: string | null): value is ChatbotFileFormat {
  return value !== null && ['docx', 'xlsx', 'pptx', 'pdf', 'csv', 'txt'].includes(value);
}
