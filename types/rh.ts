export type RHRole = 'rh_admin' | 'rh_gestionnaire' | 'rh_consultation' | 'admin' | 'directeur';

export type RHStaffStatus =
  | 'titulaire'
  | 'contractuel'
  | 'stagiaire'
  | 'detache'
  | 'vacataire';

export type RHContractType =
  | 'Fonction Publique'
  | 'CDI'
  | 'CDD'
  | 'Convention de Stage'
  | 'Vacation';

export type RHGender = 'M' | 'F';

export type RHQRStatus = 'actif' | 'revoque' | 'inactif';

export type RHPublicWhitelist = {
  photo: boolean;
  lastName: boolean;
  firstName: boolean;
  position: boolean;
  department: boolean;
  status: boolean;
  gender: boolean;
  birthDate: boolean;
  birthPlace: boolean;
  phone: boolean;
  email: boolean;
};

export type RHProfileHistoryEntry = {
  id: string;
  changedAt: string;
  changedBy: string;
  action: string;
  details: string;
};

export type RHProfile = {
  id: string;
  matricule: string;
  // Données personnelles
  firstName: string;
  lastName: string;
  gender: RHGender;
  birthDate: string; // YYYY-MM-DD
  birthPlace: string;
  phone: string;
  email: string;
  photoUrl: string;
  // Données administratives
  department: string; // Direction ou service
  position: string; // Intitulé de fonction
  status: RHStaffStatus;
  contractType: RHContractType;
  hireDate: string; // YYYY-MM-DD
  seniorityYears?: number;
  jobDescription: string; // Fiche de poste complète
  // Gestion d'archivage (soft delete)
  isArchived: boolean;
  archivedAt?: string | null;
  archiveReason?: string | null;
  // QR Code dynamique
  qrToken: string;
  qrStatus: RHQRStatus;
  qrGeneratedAt: string;
  qrRevokedAt?: string | null;
  publicWhitelist: RHPublicWhitelist;
  // Historique et audit
  history: RHProfileHistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

export type RHAuditLog = {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  targetId?: string;
  targetName?: string;
  details?: string;
  ipAddress?: string;
};

export const RH_DEPARTMENTS = [
  'Direction Générale (DG)',
  'Direction Générale Adjointe (DGA)',
  'Direction des Études et de la Pédagogie',
  'Direction de la Formation Continue',
  'Direction des Ressources Techniques et de l’Innovation (DRTI)',
  'Centre UNESCO-INPTIC',
  'Secrétariat Général',
  'Département Réseaux et Systèmes Numériques',
  'Département Management et Commerce',
  'Département Management des TIC',
  'Département Audiovisuel',
  'Service Scolarité',
  'Service Logistique et Achat',
  'Service Social',
  'Service Communication et Relations Extérieures',
  'Service Informatique et SI (SRSIAT)',
  'Service Ressources Documentaires',
  'Service Stage et Emploi',
  'Service Planification et Évaluation',
  'Service Veille Technologique et VAE',
  'Service Maintenance et Assistance Technique',
] as const;

export const DEFAULT_PUBLIC_WHITELIST: RHPublicWhitelist = {
  photo: true,
  lastName: true,
  firstName: true,
  position: true,
  department: true,
  status: true,
  gender: false, // Désactivé par défaut par prudence DRTI-CDC-2026-001
  birthDate: false,
  birthPlace: false,
  phone: false,
  email: false,
};
