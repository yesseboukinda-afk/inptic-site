export const REQUIRED_ADMISSION_DOCUMENTS = [
  'Acte de naissance / CNI',
  'Baccalauréat / Attestation / Certificat de scolarité en Terminale',
  'Relevé de notes officiel',
] as const;

export type AdmissionWorkflowProfile = {
  email?: string;
  admissionWorkflow?: {
    preRegistration?: {
      concoursSlug?: string | null;
      completedAt?: string;
    };
    applicationCompletedAt?: string;
  };
  candidatureData?: Record<string, unknown>;
  documents?: Array<{ name?: string; category?: string }>;
  paymentStatus?: string;
};

type AdmissionConcours = {
  id?: string;
  slug: string;
  status: string;
  sessionYear: number;
  createdAt?: string;
  calendar?: {
    registrationStart?: string | null;
    registrationEnd?: string | null;
  };
};

export function isAdmissionRegistrationOpen(
  concours: Pick<AdmissionConcours, 'status' | 'calendar'>,
  now = Date.now(),
) {
  if (concours.status !== 'en_cours') return false;
  const startValue = concours.calendar?.registrationStart;
  const endValue = concours.calendar?.registrationEnd;
  const start = startValue ? new Date(startValue).getTime() : null;
  const end = endValue ? new Date(endValue).getTime() : null;
  if (start !== null && (!Number.isFinite(start) || start > now)) return false;
  if (end !== null && (!Number.isFinite(end) || end < now)) return false;
  return true;
}

export function getOpenAdmissionConcours<T extends AdmissionConcours>(concours: T[], now = Date.now()) {
  return concours
    .filter((item) => {
      if (
        item.id?.startsWith('annonce-migrated-') ||
        item.id?.startsWith('seed-concours-')
      ) return false;
      return isAdmissionRegistrationOpen(item, now);
    })
    .sort((a, b) => {
      if (b.sessionYear !== a.sessionYear) return b.sessionYear - a.sessionYear;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
}

export function getCurrentAdmissionConcours<T extends AdmissionConcours>(concours: T[], now = Date.now()) {
  return getOpenAdmissionConcours(concours, now)[0] ?? null;
}

export function hasCompletedAdmissionPreRegistration(profile: AdmissionWorkflowProfile | null | undefined) {
  return Boolean(profile?.admissionWorkflow?.preRegistration?.completedAt);
}

export function getAdmissionDossierCompletionPercent(profile: AdmissionWorkflowProfile | null | undefined) {
  const values = profile?.candidatureData;
  const nationalityComplete = values?.nationalite === 'gabonaise' ||
    (values?.nationalite === 'autre' &&
      typeof values.nationaliteAutre === 'string' &&
      Boolean(values.nationaliteAutre.trim()));
  const selectedFilieres = [
    ...(Array.isArray(values?.filieresInitiale) ? values.filieresInitiale : []),
    ...(Array.isArray(values?.filieresContinue) ? values.filieresContinue : []),
  ];

  const uploadedCategories = new Set(
    (profile?.documents ?? []).map((document) => document.category || document.name?.split(' - ')[0] || '')
  );

  const requirements = [
    hasCompletedAdmissionPreRegistration(profile),
    selectedFilieres.some((filiere) => typeof filiere === 'string' && Boolean(filiere.trim())),
    typeof values?.nom === 'string' && Boolean(values.nom.trim()),
    typeof values?.prenoms === 'string' && Boolean(values.prenoms.trim()),
    typeof values?.dateNaissance === 'string' && Boolean(values.dateNaissance),
    typeof values?.lieuNaissance === 'string' && Boolean(values.lieuNaissance.trim()),
    nationalityComplete,
    typeof values?.telephone1 === 'string' && Boolean(values.telephone1.trim()),
    typeof values?.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email),
    typeof values?.baccalaureat === 'string' && Boolean(values.baccalaureat.trim()),
    typeof values?.anneeBac === 'string' && /^\d{4}$/.test(values.anneeBac),
    typeof values?.urgenceNom === 'string' && Boolean(values.urgenceNom.trim()),
    typeof values?.urgenceTelephone === 'string' && Boolean(values.urgenceTelephone.trim()),
    values?.certifie === true,
    ...REQUIRED_ADMISSION_DOCUMENTS.map((category) => uploadedCategories.has(category)),
    Boolean(profile?.admissionWorkflow?.applicationCompletedAt),
  ];
  const completedRequirements = requirements.filter(Boolean).length;
  return Math.floor((completedRequirements / requirements.length) * 100);
}

export function hasCompleteAdmissionDossier(profile: AdmissionWorkflowProfile | null | undefined) {
  return getAdmissionDossierCompletionPercent(profile) === 100;
}

export function getCandidateJourneyPath(
  profile: AdmissionWorkflowProfile | null | undefined
) {
  if (!hasCompletedAdmissionPreRegistration(profile)) return '/admissions/depot';
  if (!hasCompleteAdmissionDossier(profile)) {
    const concoursSlug = profile?.admissionWorkflow?.preRegistration?.concoursSlug;
    return `/admissions/depot${concoursSlug ? `?concours=${encodeURIComponent(concoursSlug)}` : ''}`;
  }
  if (profile?.paymentStatus === 'paid') return '/admissions/suivi';
  return '/admissions/paiement';
}
