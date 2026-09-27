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

export function getRolePath(role: string): string {
  if (role === 'admin') return '/annonces';
  if (role === 'scolarite') return '/scolarite';
  if (role === 'direction_etudes') return '/direction-etudes';
  if (role === 'communication') return '/annonces';
  if (role === 'directeur') return '/directeur';
  return '/admissions/suivi';
}
