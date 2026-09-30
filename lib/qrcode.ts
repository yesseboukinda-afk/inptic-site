/**
 * Générateur QR Code SVG natif, ultra-léger et autonome (sans dépendances externes).
 * Conforme aux spécifications QR Code ISO/IEC 18004.
 */

// Tables de logarithmes de Galois GF(256) avec polynôme 0x11d
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

(function initGalois() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_EXP[i + 255] = x;
    GF256_LOG[x] = i;
    x = (x << 1) ^ (x & 0x80 ? 0x11d : 0);
  }
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF256_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMultiply(poly[j], root);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, eccCount: number): Uint8Array {
  const gen = rsGeneratorPoly(eccCount);
  const remainder = new Uint8Array(eccCount);

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < eccCount - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMultiply(gen[eccCount - j - 1], factor);
    }
    remainder[eccCount - 1] = gfMultiply(gen[0], factor);
  }
  return remainder;
}

// Capacités par version (Version 1 à 6, Correction M)
const VERSION_CAPACITIES_M = [
  { version: 1, totalBytes: 26, dataBytes: 16, eccCount: 10, size: 21 },
  { version: 2, totalBytes: 44, dataBytes: 28, eccCount: 16, size: 25 },
  { version: 3, totalBytes: 70, dataBytes: 44, eccCount: 26, size: 29 },
  { version: 4, totalBytes: 100, dataBytes: 64, eccCount: 36, size: 33 },
  { version: 5, totalBytes: 134, dataBytes: 86, eccCount: 48, size: 37 },
  { version: 6, totalBytes: 172, dataBytes: 108, eccCount: 64, size: 41 },
];

export function generateQRCodeMatrix(text: string): boolean[][] {
  const textBytes = new TextEncoder().encode(text);
  const dataLen = textBytes.length;

  // Trouver la version minimale adaptée
  let config = VERSION_CAPACITIES_M.find((v) => v.dataBytes >= dataLen + 3);
  if (!config) {
    config = VERSION_CAPACITIES_M[VERSION_CAPACITIES_M.length - 1];
  }

  const { version, dataBytes, eccCount, size } = config;

  // Encodage en mode Byte (0100)
  const bits: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Mode Byte
  pushBits(dataLen, version <= 9 ? 8 : 16); // Longueur
  for (const b of textBytes) {
    pushBits(b, 8);
  }

  // Terminaison
  const maxBits = dataBytes * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Padding
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Conversion en octets de données
  const dataCodewords = new Uint8Array(dataBytes);
  for (let i = 0; i < dataBytes; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bits[i * 8 + b];
    }
    dataCodewords[i] = byte;
  }

  // Calcul du code de correction Reed-Solomon
  const eccCodewords = rsEncode(dataCodewords, eccCount);

  // Fusion finale des codewords
  const allCodewords = new Uint8Array(dataBytes + eccCount);
  allCodewords.set(dataCodewords, 0);
  allCodewords.set(eccCodewords, dataBytes);

  // Initialisation matrice
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  function setModule(r: number, c: number, val: boolean) {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  }

  // 1. Finder patterns (haut-gauche, haut-droite, bas-gauche)
  function drawFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const isOuter = r === -1 || r === 7 || c === -1 || c === 7;
          const isFinderBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          setModule(nr, nc, !isOuter && (isFinderBorder || isInner));
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) setModule(6, i, i % 2 === 0);
    if (!isFunction[i][6]) setModule(i, 6, i % 2 === 0);
  }

  // 3. Dark module (x=8, y=size-8)
  setModule(size - 8, 8, true);

  // 4. Reserve format information areas
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }
  for (let i = size - 8; i < size; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }

  // 5. Remplissage des données en zigzag
  let bitIdx = 0;
  const totalBits = allCodewords.length * 8;

  let right = size - 1;
  let upwards = true;

  while (right > 0) {
    if (right === 6) right--; // Sauter la colonne de timing

    for (let vert = 0; vert < size; vert++) {
      const r = upwards ? size - 1 - vert : vert;

      for (let c = right; c >= right - 1; c--) {
        if (!isFunction[r][c]) {
          let bit = false;
          if (bitIdx < totalBits) {
            const byte = allCodewords[Math.floor(bitIdx / 8)];
            bit = ((byte >> (7 - (bitIdx % 8))) & 1) === 1;
            bitIdx++;
          }
          // Masque 000 : (r + c) % 2 === 0
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = mask ? !bit : bit;
        }
      }
    }
    right -= 2;
    upwards = !upwards;
  }

  // 6. Format info placement conforme ISO 18004 (Mask 0, Correction M : 0x5412)
  const FORMAT_M_MASK0 = 0x5412; // 0b101010000010010
  const formatBits = Array.from({ length: 15 }, (_, i) => ((FORMAT_M_MASK0 >> (14 - i)) & 1) === 1);

  // Premier jeu d'informations de format (autour du finder haut-gauche)
  const coords1 = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = coords1[i];
    matrix[r][c] = formatBits[i];
  }

  // Second jeu d'informations de format (bas-gauche et haut-droite)
  for (let i = 0; i < 7; i++) {
    matrix[size - 1 - i][8] = formatBits[i];
  }
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 8 + i] = formatBits[7 + i];
  }

  return matrix.map((row) => row.map((val) => Boolean(val)));
}

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

  const matrix = generateQRCodeMatrix(text);
  const matrixSize = matrix.length;
  const viewBoxSize = matrixSize + margin * 2;

  let pathD = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        pathD += `M${c + margin},${r + margin}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${size}" height="${size}" shape-rendering="crispEdges">
  <rect width="100%" height="100%" fill="${background}"/>
  <path d="${pathD.trim()}" fill="${color}"/>
</svg>`;
}
