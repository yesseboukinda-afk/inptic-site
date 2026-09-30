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

  try {
    let svgString = '';
    QRCode.toString(
      text,
      {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin,
        color: {
          dark: color,
          light: background,
        },
        width: size,
      },
      (err, result) => {
        if (!err && result) {
          svgString = result;
        }
      }
    );

    if (svgString) {
      return svgString;
    }
  } catch (err) {
    console.error('Erreur génération QR Code officiel:', err);
  }

  // Fallback SVG de secours
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}"><rect width="100%" height="100%" fill="${background}"/></svg>`;
}
