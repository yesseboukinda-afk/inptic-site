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

export function isStaffOrAdminUser(email?: string | null, role?: unknown): boolean {
  return (
    isAdminAccountEmail(email) ||
    isDirectorAccountEmail(email) ||
    isAdminRole(role) ||
    isDirectorRole(role) ||
    isCommunicationRole(role) ||
    isRHRole(role)
  );
}

export function getRolePath(role: string): string {
  if (role === 'admin') return '/annonces/gestion';
  if (role === 'scolarite') return '/scolarite';
  if (role === 'direction_etudes') return '/direction-etudes';
  if (role === 'communication') return '/annonces/gestion';
  if (role === 'directeur') return '/directeur';
  if (isRHRole(role)) return '/admin/rh';
  return '/admissions/suivi';
}
