export type StaffRole = 'scolarite' | 'chef_departement' | 'direction_etudes';
export type AppRole = StaffRole | 'directeur' | 'etudiant';

export function normalizeRole(value: unknown): string {
  const values = Array.isArray(value) ? value : [value];
  const normalized = values
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/[\s-]+/g, '_'))
    .filter(Boolean);

  const knownRole = normalized.find((role) =>
    ['dg', 'directeur', 'director', 'directeur_general', 'scolarite', 'chef_departement', 'direction_etudes'].includes(role),
  );

  return knownRole || normalized[0] || '';
}

export function getStaffRole(value: unknown): StaffRole | '' {
  const role = normalizeRole(value);
  return role === 'scolarite' || role === 'chef_departement' || role === 'direction_etudes' ? role : '';
}

export function isDirectorRole(value: unknown): boolean {
  const role = normalizeRole(value);
  return role === 'dg' || role === 'directeur' || role === 'director' || role === 'directeur_general';
}

export function getRolePath(role: string): string {
  if (role === 'scolarite') return '/scolarite';
  if (role === 'direction_etudes') return '/direction-etudes';
  if (role === 'chef_departement') return '/chef-departement';
  if (role === 'directeur') return '/directeur';
  return '/admissions/suivi';
}
