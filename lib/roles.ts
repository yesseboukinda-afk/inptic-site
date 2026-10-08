export type StaffRole = 'scolarite' | 'direction_etudes' | 'communication' | 'admin';
export type AppRole = StaffRole | 'directeur' | 'etudiant';

export function normalizeRole(value: unknown): string {
  const values = Array.isArray(value) ? value : [value];
  const normalized = values
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/[\s-]+/g, '_'))
    .filter(Boolean);

  const knownRole = normalized.find((role) =>
    [
      'admin',
      'administrateur',
      'administrator',
      'superadmin',
      'dg',
      'directeur',
      'director',
      'directeur_general',
      'scolarite',
      'direction_etudes',
      'communication',
      'responsable_communication',
      'responsable_de_communication',
      'rh',
      'drh',
      'rh_admin',
      'rh_gestionnaire',
      'rh_consultation',
    ].includes(role),
  );

  return knownRole || normalized[0] || '';
}

export function getStaffRole(value: unknown): StaffRole | '' {
  const role = normalizeRole(value);
  if (role === 'admin' || role === 'administrateur' || role === 'administrator' || role === 'superadmin') return 'admin';
  if (role === 'scolarite' || role === 'direction_etudes') return role;
  if (role === 'communication' || role === 'responsable_communication' || role === 'responsable_de_communication') return 'communication';
  return '';
}

export function isDirectorRole(value: unknown): boolean {
  const role = normalizeRole(value);
  return role === 'dg' || role === 'directeur' || role === 'director' || role === 'directeur_general';
}

export function isAdminRole(value: unknown): boolean {
  const role = normalizeRole(value);
  return (
    role === 'admin' ||
    role === 'administrateur' ||
    role === 'administrator' ||
    role === 'superadmin' ||
    isDirectorRole(role)
  );
}

export function isSuperAdminRole(value: unknown): boolean {
  return normalizeRole(value) === 'superadmin';
}

export function isCommunicationRole(value: unknown): boolean {
  const role = normalizeRole(value);
  return (
    role === 'communication' ||
    role === 'responsable_communication' ||
    role === 'responsable_de_communication'
  );
}

export function isAdminAccountEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase().replace(/,/g, '.');
  const configured = (
    process.env.ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    ''
  )
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return (
    normalized === 'admin@inptic.ga' ||
    normalized.startsWith('admin@') ||
    normalized === 'rh@inptic.ga' ||
    normalized === 'drh@inptic.ga' ||
    normalized === 'yesseboukinda@gmail.com' ||
    normalized === 'yessemabicka@gmail.com' ||
    configured.includes(normalized)
  );
}

export function isDirectorAccountEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase().replace(/,/g, '.');
  return normalized === 'directeur@inptic.ga';
}

export function isRHAccountEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase().replace(/,/g, '.');
  return (
    normalized === 'rh@inptic.ga' ||
    normalized === 'drh@inptic.ga' ||
    normalized.startsWith('rh@') ||
    normalized.startsWith('drh@') ||
    normalized.includes('ressources-humaines') ||
    normalized.includes('rh.')
  );
}

export function isRHRole(value: unknown): boolean {
  const role = normalizeRole(value);
  return (
    role === 'rh' ||
    role === 'drh' ||
    role === 'rh_admin' ||
    role === 'rh_gestionnaire' ||
    role === 'rh_consultation'
  );
}

export function isRHAdminRole(value: unknown): boolean {
  return ['rh', 'drh', 'rh_admin', 'rh_gestionnaire', 'rh_consultation'].includes(normalizeRole(value));
}

export type StaffService =
  | 'candidate_profiles'
  | 'preinscriptions'
  | 'concours'
  | 'publications'
  | 'formations'
  | 'announcements'
  | 'reputation'
  | 'human_resources';

export const STAFF_SERVICE_OPTIONS = [
  { value: 'scolarite', label: 'Scolarité' },
  { value: 'communication', label: 'Communication' },
  { value: 'direction_etudes', label: 'Direction des études' },
  { value: 'rh', label: 'Ressources humaines' },
] as const;

export type StaffServiceAssignment = (typeof STAFF_SERVICE_OPTIONS)[number]['value'];

export function normalizeStaffService(value: unknown): StaffServiceAssignment | '' {
  if (typeof value !== 'string') return '';
  const service = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (service === 'scolarite' || service.includes('service_scolarite')) return 'scolarite';
  if (service === 'communication' || service.includes('communication')) return 'communication';
  if (service === 'direction_etudes' || service.includes('direction_des_etudes') || service.includes('direction_etudes')) return 'direction_etudes';
  if (service === 'rh' || service.includes('ressources_humaines') || service.includes('service_rh') || service.includes('direction_rh')) return 'rh';
  return '';
}

export function serviceAssignmentForRole(value: unknown): StaffServiceAssignment | '' {
  const role = normalizeRole(value);
  if (role === 'scolarite') return 'scolarite';
  if (role === 'direction_etudes') return 'direction_etudes';
  if (isCommunicationRole(role)) return 'communication';
  if (isRHRole(role)) return 'rh';
  return '';
}

export function canAccessStaffService(value: unknown, service: StaffService, assignedService?: unknown): boolean {
  const role = normalizeRole(value);

  if (isSuperAdminRole(role)) return true;

  const assignment = role === 'admin'
    ? normalizeStaffService(assignedService)
    : serviceAssignmentForRole(role);
  if (!assignment) return false;

  switch (service) {
    case 'candidate_profiles':
    case 'preinscriptions':
      return assignment === 'scolarite';
    case 'concours':
    case 'publications':
    case 'formations':
      return assignment === 'direction_etudes';
    case 'announcements':
      return assignment === 'communication';
    case 'reputation':
      return assignment === 'communication';
    case 'human_resources':
      return assignment === 'rh';
  }

  return false;
}
export function isScolariteAccountEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase().replace(/,/g, '.');
  return (
    normalized === 'scolarite@inptic.ga' ||
    normalized === 'scol@inptic.ga' ||
    normalized.startsWith('scolarite@') ||
    normalized.startsWith('scol@') ||
    normalized.includes('scolarite')
  );
}

export function isStaffOrAdminUser(email?: string | null, role?: unknown): boolean {
  return (
    isAdminAccountEmail(email) ||
    isDirectorAccountEmail(email) ||
    isRHAccountEmail(email) ||
    isScolariteAccountEmail(email) ||
    isAdminRole(role) ||
    isDirectorRole(role) ||
    isCommunicationRole(role) ||
    isRHRole(role) ||
    normalizeRole(role) === 'scolarite'
  );
}

export function getRolePath(role: string, _email?: string, assignedService?: unknown): string {
  if (isSuperAdminRole(role)) return '/admin';
  const normalizedRole = normalizeRole(role);
  const assignment = normalizedRole === 'admin'
    ? normalizeStaffService(assignedService)
    : serviceAssignmentForRole(normalizedRole);
  if (assignment === 'rh') return '/admin/rh';
  if (assignment === 'scolarite') return '/scolarite';
  if (assignment === 'communication') return '/annonces/gestion';
  if (assignment === 'direction_etudes') return '/concours';
  return '/admissions/suivi';
}
