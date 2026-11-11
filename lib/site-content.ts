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
  { path: 'banniere/page-actualites.webp', label: 'Page Actualités', fallback: 'banniere/1.webp' },
  { path: 'banniere/page-admissions.webp', label: 'Page Admissions', fallback: 'banniere/2.webp' },
  { path: 'banniere/page-guide-admissions.webp', label: 'Page Guide des admissions', fallback: 'banniere/2.webp' },
  { path: 'banniere/page-suivi-admissions.webp', label: 'Page Suivi des admissions', fallback: 'banniere/3.webp' },
  { path: 'banniere/page-depot-admissions.webp', label: 'Page Dépôt de candidature', fallback: 'banniere/1.webp' },
  { path: 'banniere/page-paiement-admissions.webp', label: 'Page Paiement des admissions', fallback: 'banniere/2.webp' },
  { path: 'banniere/page-annonces.webp', label: 'Page Annonces', fallback: 'banniere/1.webp' },
  { path: 'banniere/page-visite-3d.webp', label: 'Page Visite 3D', fallback: 'banniere/7.webp' },
  { path: 'banniere/page-presentation-institut.webp', label: 'Page Présentation de l’INPTIC', fallback: 'banniere/DGA.webp' },
  { path: 'banniere/page-institut.webp', label: 'Page Institut', fallback: 'banniere/DG.webp' },
  { path: 'banniere/page-gouvernance.webp', label: 'Page Gouvernance', fallback: 'banniere/7.webp' },
  { path: 'banniere/page-certifications-institut.webp', label: 'Page Certifications de l’INPTIC', fallback: 'banniere/4.webp' },
  { path: 'banniere/page-contact.webp', label: 'Page Contact', fallback: 'banniere/7.webp' },
  { path: 'banniere/page-formation-telecoms.webp', label: 'Page Formation Télécoms', fallback: 'banniere/6.webp' },
  { path: 'banniere/page-alumni.webp', label: 'Page Alumni', fallback: 'banniere/1.webp' },
  { path: 'banniere/page-formation-postes-logistique.webp', label: 'Page Formation Postes et logistique', fallback: 'banniere/6.webp' },
  { path: 'banniere/page-formations.webp', label: 'Page Formations', fallback: 'banniere/6.webp' },
  { path: 'banniere/page-publications.webp', label: 'Page Publications scientifiques', fallback: 'banniere/7.webp' },
  { path: 'banniere/page-concours.webp', label: 'Page Concours', fallback: 'banniere/6.webp' },
  { path: 'banniere/page-formation-cybersecurite.webp', label: 'Page Formation Cybersécurité', fallback: 'banniere/6.webp' },
  { path: 'banniere/page-formation-monetique.webp', label: 'Page Formation Monétique', fallback: 'banniere/6.webp' },
  { path: 'banniere/page-formation-genie-logiciel.webp', label: 'Page Formation Génie logiciel', fallback: 'banniere/6.webp' },
  { path: 'banniere/page-projets-recherche.webp', label: 'Page Projets de recherche', fallback: 'banniere/3.webp' },
  { path: 'banniere/page-quittance.webp', label: 'Page Quittance', fallback: 'banniere/4.webp' },
  { path: 'banniere/page-recherche.webp', label: 'Page Recherche', fallback: 'banniere/3.webp' },
  { path: 'banniere/page-laboratoires.webp', label: 'Page Laboratoires', fallback: 'banniere/3.webp' },
  { path: 'banniere/page-incubateur.webp', label: 'Page Incubateur', fallback: 'banniere/3.webp' },
  { path: 'banniere/page-entreprises.webp', label: 'Page Entreprises', fallback: 'banniere/5.webp' },
  { path: 'banniere/page-directeur.webp', label: 'Page Directeur général', fallback: 'banniere/DG.webp' },
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
