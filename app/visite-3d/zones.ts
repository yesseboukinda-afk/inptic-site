export type Zone = {
  id: string;
  labelKey: string;
  point: [number, number, number]; // où se trouve le repère
  camera: [number, number, number]; // d'où la caméra regarde
};

// Le modèle est normalisé à ~20 unités et centré sur (0,0,0).
// Valeurs provisoires : remplace-les avec les coordonnées lues dans la console.
export const zones: Zone[] = [
  { id: 'campus', labelKey: 'pages.zoneCampus', point: [0, 2, 0], camera: [12, 9, 12] },
  { id: 'formations', labelKey: 'pages.zoneFormations', point: [6, 2, -4], camera: [12, 7, 2] },
  { id: 'innovation', labelKey: 'pages.zoneInnovation', point: [-6, 2, 5], camera: [-10, 7, 12] },
];