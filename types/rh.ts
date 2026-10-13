export type RHRole = 'admin' | 'superadmin';

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
  matricule: boolean;
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

export const RH_PUBLIC_WHITELIST_FIELDS = [
  { key: 'photo', label: 'Photo' },
  { key: 'matricule', label: 'Matricule' },
  { key: 'lastName', label: 'Nom' },
  { key: 'firstName', label: 'Prénom' },
  { key: 'position', label: 'Fonction' },
  { key: 'department', label: 'Direction' },
  { key: 'status', label: 'Statut professionnel' },
  { key: 'gender', label: 'Genre' },
  { key: 'birthDate', label: 'Date de naissance' },
  { key: 'birthPlace', label: 'Lieu de naissance' },
  { key: 'email', label: 'Courriel' },
  { key: 'phone', label: 'Téléphone' },
] as const satisfies ReadonlyArray<{ key: keyof RHPublicWhitelist; label: string }>;

export function normalizeRHPublicWhitelist(value: unknown): RHPublicWhitelist {
  let parsedValue = value;
  if (typeof parsedValue === 'string') {
    try {
      parsedValue = JSON.parse(parsedValue) as unknown;
    } catch {
      parsedValue = null;
    }
  }

  const whitelist =
    parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)
      ? parsedValue as Record<string, unknown>
      : {};
  const getBoolean = (key: keyof RHPublicWhitelist, defaultValue: boolean) => {
    const field = whitelist[key];
    if (typeof field === 'boolean') return field;
    if (field === 1 || field === 'true') return true;
    if (field === 0 || field === 'false') return false;
    return defaultValue;
  };

  return {
    photo: getBoolean('photo', DEFAULT_PUBLIC_WHITELIST.photo),
    matricule: getBoolean('matricule', DEFAULT_PUBLIC_WHITELIST.matricule),
    lastName: getBoolean('lastName', DEFAULT_PUBLIC_WHITELIST.lastName),
    firstName: getBoolean('firstName', DEFAULT_PUBLIC_WHITELIST.firstName),
    position: getBoolean('position', DEFAULT_PUBLIC_WHITELIST.position),
    department: getBoolean('department', DEFAULT_PUBLIC_WHITELIST.department),
    status: getBoolean('status', DEFAULT_PUBLIC_WHITELIST.status),
    gender: getBoolean('gender', DEFAULT_PUBLIC_WHITELIST.gender),
    birthDate: getBoolean('birthDate', DEFAULT_PUBLIC_WHITELIST.birthDate),
    birthPlace: getBoolean('birthPlace', DEFAULT_PUBLIC_WHITELIST.birthPlace),
    phone: getBoolean('phone', DEFAULT_PUBLIC_WHITELIST.phone),
    email: getBoolean('email', DEFAULT_PUBLIC_WHITELIST.email),
  };
}

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
  direction: string;
  service: string;
  department: string; // Champ historique conservé pour les intégrations existantes
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
  matricule: true,
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
