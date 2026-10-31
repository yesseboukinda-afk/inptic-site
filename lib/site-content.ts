export type SiteTrack = {
  id: string;
  name: string;
  presentation: string;
  opportunities: string[];
};

export type SiteCertification = {
  id: string;
  name: string;
  presentation: string;
  issuer: string | null;
  duration: string | null;
  website: string | null;
};

export type SiteTraining = {
  id: string;
  name: string;
  category: 'diplomante' | 'qualifiante';
  trackId: string | null;
  trackName: string | null;
  presentation: string;
  opportunities: string[];
};

export const SITE_IMAGE_SLOTS = [
  { path: 'banniere/1.webp', label: 'Bannière 1' },
  { path: 'banniere/2.webp', label: 'Bannière 2' },
  { path: 'banniere/3.webp', label: 'Bannière 3' },
  { path: 'banniere/4.webp', label: 'Bannière 4' },
  { path: 'banniere/5.webp', label: 'Bannière 5' },
  { path: 'banniere/6.webp', label: 'Bannière 6' },
  { path: 'banniere/7.webp', label: 'Bannière 7' },
  { path: 'banniere/DG.webp', label: 'Directeur général' },
  { path: 'banniere/DGA.webp', label: 'Directeur général adjoint' },
  { path: 'banniere/binary.webp', label: 'Binaire' },
  { path: 'banniere/informatique.webp', label: 'Informatique' },
  { path: 'banniere/linux.jpg', label: 'Linux' },
  { path: 'banniere/management-tic.webp', label: 'Management des TIC' },
  { path: 'banniere/mobile.jpg', label: 'Mobile' },
  { path: 'banniere/multimedia-internet.webp', label: 'Multimédia et Internet' },
  { path: 'banniere/telecommunications.webp', label: 'Télécommunications' },
  { path: 'institut/1.webp', label: 'Institut – photo 1' },
  { path: 'institut/2.webp', label: 'Institut – photo 2' },
  { path: 'institut/3.webp', label: 'Institut – photo 3' },
  { path: 'institut/4.webp', label: 'Institut – photo 4' },
  { path: 'institut/5.webp', label: 'Institut – photo 5' },
  { path: 'formations/informatique.webp', label: 'Formation – Informatique' },
  { path: 'formations/audiovisuel-1.webp', label: 'Formation – Audiovisuel' },
  { path: 'formations/telecommunications.webp', label: 'Formation – Télécommunications' },
  { path: 'formations/management-tic.webp', label: 'Formation – Management des TIC' },
  { path: 'formations/multimedia-internet.webp', label: 'Formation – Multimédia et Internet' },
] as const;

export type SiteImageSlot = (typeof SITE_IMAGE_SLOTS)[number]['path'];

export type PublicSiteContent = {
  filieres: SiteTrack[];
  formations: SiteTraining[];
  certifications: SiteCertification[];
};
