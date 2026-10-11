import QRCode from 'qrcode';

/**
 * Générateur QR Code SVG natif utilisant le package officiel 'qrcode'.
 * Conforme à 100% aux spécifications ISO/IEC 18004 et scannable sur tous les smartphones.
 */
export function generateQRCodeSVG(
  text: string,
  options: {
    size?: number;
    margin?: number;
    color?: string;
    background?: string;
  } = {}
): string {
  const {
    size = 280,
    margin = 4,
    color = '#0f172a',
    background = '#ffffff',
  } = options;
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const quietZone = Math.max(4, Math.ceil(margin));
  const viewSize = qr.modules.size + quietZone * 2;
  const darkModules: string[] = [];

  for (let row = 0; row < qr.modules.size; row++) {
    let column = 0;
    while (column < qr.modules.size) {
      if (!qr.modules.get(row, column)) {
        column++;
        continue;
      }

      const start = column;
      while (column < qr.modules.size && qr.modules.get(row, column)) {
        column++;
      }
      darkModules.push(
        `M${start + quietZone} ${row + quietZone}h${column - start}v1H${start + quietZone}z`,
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${viewSize} ${viewSize}" shape-rendering="crispEdges"><rect width="${viewSize}" height="${viewSize}" fill="${background}"/><path fill="${color}" d="${darkModules.join('')}"/></svg>`;
}
