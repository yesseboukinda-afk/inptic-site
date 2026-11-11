'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, CheckCircle2, ArrowRight, Eye, Upload } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useTranslation } from 'react-i18next';
import FormulaireCandidatureLicence, { CandidatureValues } from '@/app/scolarite/formulaire/Formulairecandidature';
import AdmissionJourneyNavigation from '@/components/AdmissionJourneyNavigation';
import type { ConcoursItem } from '@/types/concours';
import {
  getOpenAdmissionConcours,
  hasCompletedAdmissionPreRegistration,
  hasCompleteAdmissionDossier,
  getAdmissionDossierCompletionPercent,
  REQUIRED_ADMISSION_DOCUMENTS,
} from '@/lib/admissionsWorkflow';

type AdmissionDocument = {
  name: string;
  category: string;
  type: string;
  data?: string;
  path?: string;
  url?: string;
};

function formatAdmissionDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat('fr-GA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Libreville',
  }).format(date);
}

export default function DepotPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<AdmissionDocument[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [openConcours, setOpenConcours] = useState<ConcoursItem[]>([]);
  const [preRegistrationSaving, setPreRegistrationSaving] = useState(false);
  const [preRegistrationError, setPreRegistrationError] = useState('');
  const [accountCreated, setAccountCreated] = useState(false);
  const [concoursSlug, setConcoursSlug] = useState('');
  const [showNewsletterReminder, setShowNewsletterReminder] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setConcoursSlug(searchParams.get('concours') || '');
    setShowNewsletterReminder(searchParams.get('newsletterReminder') === '1');
    setAccountCreated(searchParams.get('accountCreated') === '1');
    const syncUser = async () => {
      let storedProfile: Record<string, any> = {};
      try {
        storedProfile = JSON.parse(localStorage.getItem('inptic_user') || '{}');
      } catch {
        storedProfile = {};
      }

      try {
        const { data, error } = await authClient.auth.getSession();
        if (error) throw error;
        const authenticatedUser = data.session?.user;
        if (authenticatedUser?.email) {
          const response = await fetch('/api/candidat/profile', { cache: 'no-store' });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || 'Impossible de charger votre profil candidat.');
          const remoteProfile = Array.isArray(payload.profiles)
            ? payload.profiles.find((profile: Record<string, any>) =>
                profile.email?.toLowerCase() === authenticatedUser.email?.toLowerCase())
            : null;
          const profile = remoteProfile
            ? {
                ...storedProfile,
                ...remoteProfile,
                name: remoteProfile.name || storedProfile.name || authenticatedUser.user_metadata?.full_name || 'Candidat',
                email: authenticatedUser.email,
              }
            : {
                ...storedProfile,
                email: authenticatedUser.email,
                name: authenticatedUser.user_metadata?.full_name || storedProfile.name || 'Candidat',
              };
          setCurrentUser(profile);
          const documents = Array.isArray(profile.documents) ? profile.documents : [];
          setUploadedFiles(documents.filter((document: AdmissionDocument) =>
            REQUIRED_ADMISSION_DOCUMENTS.includes(document.category as (typeof REQUIRED_ADMISSION_DOCUMENTS)[number])
          ));
          if (remoteProfile) localStorage.setItem('inptic_user', JSON.stringify(profile));
        } else if (storedProfile.email) {
          setCurrentUser(storedProfile);
          setUploadedFiles((storedProfile.documents || []).filter((document: AdmissionDocument) =>
            REQUIRED_ADMISSION_DOCUMENTS.includes(document.category as (typeof REQUIRED_ADMISSION_DOCUMENTS)[number])
          ));
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Impossible de charger votre dossier candidat.');
        if (storedProfile.email) setCurrentUser(storedProfile);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
    fetch('/api/concours', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Impossible de charger les concours ouverts.');
        const available = getOpenAdmissionConcours(
          Array.isArray(payload.data) ? payload.data as ConcoursItem[] : [],
        );
        setOpenConcours(available);
      })
      .catch((error) => {
        setPreRegistrationError(error instanceof Error ? error.message : 'Impossible de charger les concours ouverts.');
      });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, categoryLabel: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      setUploadError(`${categoryLabel} : seuls les fichiers PDF, JPG, PNG ou WebP sont acceptés.`);
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(`${categoryLabel} : le fichier ne doit pas dépasser 5 Mo.`);
      e.target.value = '';
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = () => {
      const fileData = typeof reader.result === 'string' ? reader.result : '';
      const newDoc = {
        name: `${categoryLabel} - ${file.name}`,
        category: categoryLabel,
        type: file.type || 'application/octet-stream',
        data: fileData,
      };
      setUploadedFiles((prev) => [...prev.filter((document) => document.category !== categoryLabel), newDoc]);
    };
    reader.onerror = () => setUploadError(`Lecture impossible pour le fichier « ${file.name} ».`);
    reader.readAsDataURL(file);
  };

  const handlePreRegistration = async () => {
    if (!currentUser?.email) {
      setPreRegistrationError('Connectez-vous à votre compte candidat pour continuer.');
      return;
    }
    const selectedConcours = openConcours[0];
    if (!selectedConcours) {
      setPreRegistrationError('Aucun concours ouvert n’est disponible pour le moment.');
      return;
    }

    setPreRegistrationSaving(true);
    setPreRegistrationError('');
    try {
      const { data, error } = await authClient.auth.getSession();
      if (error) throw error;
      if (!data.session) {
        router.push('/candidat');
        return;
      }

      const response = await fetch('/api/concours/preinscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concoursSlug: selectedConcours.slug,
          fullName: currentUser.name || '',
          phone: currentUser.phone || '',
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Préinscription impossible.');

      const profile = {
        ...currentUser,
        admissionWorkflow: {
          ...currentUser.admissionWorkflow,
          preRegistration: {
            concoursSlug: selectedConcours.slug,
            concoursTitle: selectedConcours.title,
            completedAt: new Date().toISOString(),
            status: 'dossier_en_attente',
          },
        },
      };
      const profileResponse = await fetch('/api/candidat/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const profilePayload = await profileResponse.json().catch(() => ({}));
      if (!profileResponse.ok) {
        throw new Error(profilePayload.error || 'La préinscription a été reçue, mais son rattachement au compte a échoué. Réessayez.');
      }
      const savedProfile = {
        ...profile,
        ...(profilePayload.profile || {}),
        admissionWorkflow: profile.admissionWorkflow,
      };
      setCurrentUser(savedProfile);
      setConcoursSlug(selectedConcours.slug);
      localStorage.setItem('inptic_user', JSON.stringify(savedProfile));
      window.dispatchEvent(new Event('auth-state-changed'));
      window.history.replaceState(null, '', `/admissions/depot?concours=${encodeURIComponent(selectedConcours.slug)}`);
    } catch (error) {
      setPreRegistrationError(error instanceof Error ? error.message : 'Préinscription impossible.');
    } finally {
      setPreRegistrationSaving(false);
    }
  };

  const handleFormSubmit = async (values: CandidatureValues, photo: File | null) => {
    if (!currentUser?.email) {
      alert('Veuillez vous connecter avant de soumettre votre dossier.');
      router.push('/candidat');
      return;
    }

    const missingDocuments = REQUIRED_ADMISSION_DOCUMENTS.filter(
      (category) => !uploadedFiles.some((document) => document.category === category)
    );
    if (missingDocuments.length) {
      throw new Error(`Ajoutez tous les justificatifs obligatoires : ${missingDocuments.join(', ')}.`);
    }

    let photoUrl = '';
    if (photo) {
      try {
        const reader = new FileReader();
        photoUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.readAsDataURL(photo);
        });
      } catch {
        // ignore
      }
    }

    const nowIso = new Date().toISOString();
    const dossierNumero = `INPTIC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const selectedFilieres = [...values.filieresInitiale, ...values.filieresContinue];

    const updatedProfile = {
      ...currentUser,
      email: values.email || currentUser.email,
      name: `${values.nom} ${values.prenoms}`.trim() || currentUser.name,
      phone: values.telephone1 || currentUser.phone,
      photo: photoUrl || currentUser.photo,
      filiere: selectedFilieres.join(', ') || 'Licence Professionnelle',
      niveau: 'Licence Professionnelle',
      diplome: values.baccalaureat,
      parcours: `Bac ${values.baccalaureat} (${values.anneeBac}). ${values.cursus.filter(c => c.etablissement).map(c => `${c.annee}: ${c.etablissement} (${c.diplome})`).join('; ')}`,
      documents: [
        ...uploadedFiles,
        ...(currentUser.documents || []).filter(
          (document: { category?: string }) =>
            !uploadedFiles.some((uploaded) => uploaded.category === document.category)
        ),
      ],
      dossierValide: false,
      status: 'en_attente',
      dossierStep: 'en_attente',
      dossierNumero,
      accuseReceptionDate: nowIso,
      candidatureData: values,
      admissionWorkflow: {
        ...currentUser.admissionWorkflow,
        applicationCompletedAt: nowIso,
      },
    };

    if (!hasCompleteAdmissionDossier(updatedProfile)) {
      throw new Error('Le dépôt ne peut pas être finalisé : vérifiez que votre préinscription est enregistrée, que toutes les pièces obligatoires sont jointes et que tous les champs obligatoires du formulaire sont renseignés.');
    }

    const response = await fetch('/api/candidat/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProfile),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Le dossier et ses documents n’ont pas pu être enregistrés.');
    }

    const profileToPersist = {
      ...updatedProfile,
      ...(payload.profile && Array.isArray(payload.profile.documents)
        ? { documents: payload.profile.documents }
        : {}),
    };
    localStorage.setItem('inptic_user', JSON.stringify(profileToPersist));

    const storedUsers = JSON.parse(localStorage.getItem('inptic_users') || '[]');
    const nextUsers = storedUsers.map((user: any) =>
      user.email === profileToPersist.email ? profileToPersist : user
    );
    if (!storedUsers.some((user: any) => user.email === profileToPersist.email)) {
      nextUsers.push(profileToPersist);
    }
    localStorage.setItem('inptic_users', JSON.stringify(nextUsers));
    window.dispatchEvent(new Event('auth-state-changed'));
    router.push(`/admissions/paiement?concours=${encodeURIComponent(concoursSlug)}`);
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Chargement du formulaire de candidature...</p>
      </main>
    );
  }

  const candidateNameParts = String(currentUser?.name || '').trim().split(/\s+/).filter(Boolean);
  const uploadedCategories = new Set(uploadedFiles.map((document) => document.category));
  const allRequiredDocumentsUploaded = REQUIRED_ADMISSION_DOCUMENTS.every((category) => uploadedCategories.has(category));
  const uploadedRequiredCount = REQUIRED_ADMISSION_DOCUMENTS.filter((category) => uploadedCategories.has(category)).length;
  const missingPreRegistration = currentUser && !hasCompletedAdmissionPreRegistration(currentUser);
  const dossierCompletionPercent = getAdmissionDossierCompletionPercent(currentUser);
  const paymentUnlocked = Boolean(currentUser && hasCompleteAdmissionDossier(currentUser));
  const isPreRegistered = hasCompletedAdmissionPreRegistration(currentUser);
  const completedJourneySteps = [
    ...(currentUser ? ['account' as const] : []),
    ...(openConcours.length || isPreRegistered ? ['opening' as const, 'contest' as const] : []),
    ...(isPreRegistered ? ['preRegistration' as const] : []),
    ...(paymentUnlocked ? ['dossier' as const] : []),
    ...(currentUser?.paymentStatus === 'paid' ? ['payment' as const] : []),
  ];
  const currentJourneyStep = !currentUser
    ? 'account'
    : !openConcours.length && !isPreRegistered
      ? 'opening'
      : !isPreRegistered
        ? 'preRegistration'
        : paymentUnlocked
          ? 'payment'
          : 'dossier';

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* En-tête */}
      <section className="relative isolate overflow-hidden text-white bg-slate-950">
        <img src="/banniere/page-depot-admissions.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.88) 30%, rgba(15, 23, 42, 0.48) 50%, rgba(30, 136, 168, 0.16) 75%, rgba(30, 136, 168, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <img src="/logoinptic.ico" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
          <h1 className="text-4xl font-black md:text-6xl">{t('depotPage.title', 'Dépôt de Dossier de Candidature')}</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            {t('depotPage.intro', 'À l’étape 5, joignez vos pièces et enregistrez le formulaire officiel complet. Le paiement se débloquera une fois toutes ces informations enregistrées.')}
          </p>
        </div>
      </section>

      <section className="py-8">
        <AdmissionJourneyNavigation
          current={currentJourneyStep}
          completed={completedJourneySteps}
          paymentUnlocked={paymentUnlocked}
        />
      </section>

      {/* Si non connecté */}
      {!currentUser ? (
        <section className="container-x mt-10 px-4 md:px-0 max-w-xl mx-auto">
          <div className="rounded-3xl border border-blue-200 bg-white p-8 text-center shadow-lg">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <LogIn size={28} />
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-900">{t('depotPage.loginRequired', 'Connexion au compte requise')}</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {t('depotPage.loginDesc', 'Veuillez vous connecter à votre compte candidat ou créer un compte avant de remplir et soumettre votre dossier de candidature.')}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/candidat"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
              >
                <span>{t('depotPage.loginBtn', "Se connecter / S'inscrire")}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      ) : !hasCompletedAdmissionPreRegistration(currentUser) ||
        (concoursSlug && currentUser.admissionWorkflow?.preRegistration?.concoursSlug !== concoursSlug) ? (
        <section className="container-x mt-10 px-4 md:px-0 max-w-xl mx-auto">
          <div className="rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-lg">
            <h2 className="text-xl font-black text-slate-900">{missingPreRegistration ? 'Concours ouvert' : 'Préinscription requise'}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {missingPreRegistration
                ? 'Votre préinscription sera automatiquement rattachée à la session actuellement ouverte. Vérifiez les informations ci-dessous avant de continuer.'
                : 'Votre préinscription correspond à une autre session. La session actuellement ouverte sera sélectionnée automatiquement.'}
            </p>
            {openConcours[0] ? (
              <>
                <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left">
                  <h3 className="font-bold text-slate-900">{openConcours[0].title}</h3>
                  <p className="mt-1 text-sm font-semibold text-blue-800">
                    Session {openConcours[0].sessionYear}
                  </p>
                  <dl className="mt-3 space-y-2 text-sm text-slate-700">
                    <div className="flex flex-wrap gap-x-1">
                      <dt className="font-semibold">Préinscriptions :</dt>
                      <dd>
                        {formatAdmissionDate(openConcours[0].calendar.registrationStart) || 'date non précisée'}
                        {' – '}
                        {formatAdmissionDate(openConcours[0].calendar.registrationEnd) || 'date non précisée'}
                      </dd>
                    </div>
                    {formatAdmissionDate(openConcours[0].calendar.examDate) && (
                      <div className="flex flex-wrap gap-x-1">
                        <dt className="font-semibold">Date du concours :</dt>
                        <dd>{formatAdmissionDate(openConcours[0].calendar.examDate)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                <button
                  type="button"
                  disabled={preRegistrationSaving}
                  onClick={handlePreRegistration}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {preRegistrationSaving ? 'Enregistrement...' : 'Me préinscrire'} <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                Aucun concours n’est ouvert actuellement. Revenez lorsque les inscriptions seront ouvertes.
              </p>
            )}
            {preRegistrationError && (
              <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{preRegistrationError}</p>
            )}
          </div>
        </section>
      ) : (
        <section className="container-x mt-6 px-4 md:px-0 max-w-6xl mx-auto">
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{t('depotPage.connectedAs', 'Candidat connecté :')} <strong className="text-emerald-950">{currentUser.name || currentUser.email}</strong> ({currentUser.email})</span>
            </div>
            <Link href="/admissions/suivi" className="text-blue-700 underline font-bold">
              {t('depotPage.viewTracking', 'Voir mon suivi de dossier')}
            </Link>
          </div>

          {accountCreated && (
            <p role="status" className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
              Votre compte est activé. Continuez votre inscription au concours depuis cette page.
            </p>
          )}

          {hasCompletedAdmissionPreRegistration(currentUser) && (
            <div className="mb-6 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">Complétion du dossier</h2>
                  <p className="mt-1 text-xs text-slate-600">
                    {dossierCompletionPercent === 100
                      ? 'Dossier complet et enregistré : le paiement est débloqué.'
                      : 'Le paiement se débloquera après l’ajout des pièces obligatoires et l’enregistrement de tous les champs obligatoires du formulaire.'}
                  </p>
                </div>
                <span className={`text-lg font-black ${dossierCompletionPercent === 100 ? 'text-emerald-700' : 'text-blue-700'}`}>
                  {dossierCompletionPercent}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Complétion du dossier de candidature"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={dossierCompletionPercent}
                className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  className={`h-full rounded-full transition-all ${dossierCompletionPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                  style={{ width: `${dossierCompletionPercent}%` }}
                />
              </div>
            </div>
          )}

          {showNewsletterReminder && (
            <div
              role="status"
              className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
            >
              <p>
                Votre préinscription au concours est enregistrée. Inscrivez-vous à la newsletter pour ne manquer aucune actualité ni information importante.
              </p>
              <a
                href="/#newsletter"
                className="shrink-0 rounded-lg bg-amber-400 px-4 py-2 text-center font-bold text-slate-950 hover:bg-amber-300"
              >
                Découvrir la newsletter
              </a>
            </div>
          )}

          {loadError && (
            <p role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
              {loadError}
            </p>
          )}

          {loadError ? (
            <div className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center">
              <h2 className="font-black text-rose-900">Chargement du dossier indisponible</h2>
              <p className="mt-2 text-sm text-rose-800">Rechargez cette page lorsque le service sera rétabli. Le formulaire reste verrouillé tant que votre dossier n’a pas pu être chargé.</p>
            </div>
          ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Formulaire principal */}
            <div className="rounded-3xl border border-slate-200 bg-white p-2 sm:p-6 shadow-sm">
              <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center justify-between gap-3 text-sm font-bold text-blue-950">
                  <span>Justificatifs obligatoires</span>
                  <span>{uploadedRequiredCount} / {REQUIRED_ADMISSION_DOCUMENTS.length}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
                  <div
                    className="h-full rounded-full bg-blue-700 transition-all"
                    style={{ width: `${uploadedRequiredCount / REQUIRED_ADMISSION_DOCUMENTS.length * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-blue-900">
                  Ajoutez les trois pièces, remplissez tous les champs obligatoires et enregistrez le formulaire pour débloquer le paiement.
                </p>
              </div>
              <FormulaireCandidatureLicence
                logoSrc="/logoinptic.ico"
                initialValues={{
                  ...currentUser.candidatureData,
                  nom: currentUser.candidatureData?.nom || candidateNameParts[0] || '',
                  prenoms: currentUser.candidatureData?.prenoms || candidateNameParts.slice(1).join(' '),
                  email: currentUser.candidatureData?.email || currentUser.email || '',
                  telephone1: currentUser.candidatureData?.telephone1 || currentUser.phone || '',
                }}
                lockEmail
                submitDisabled={!allRequiredDocumentsUploaded}
                submitLabel="Enregistrer et envoyer le dossier"
                successTitle="Dossier enregistré"
                successMessage="Votre formulaire complet et vos pièces sont enregistrés. Le paiement est maintenant débloqué."
                onSubmit={handleFormSubmit}
              />
            </div>

            {/* Panneau latéral des pièces justificatives */}
            <aside className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm h-fit lg:sticky lg:top-24 space-y-4">
              <div className="flex items-center gap-2 text-blue-700 border-b border-slate-100 pb-3">
                <Upload size={18} />
                <h3 className="font-bold text-sm text-slate-900">{t('depotPage.digitalDocs', 'Pièces justificatives numériques')}</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('depotPage.digitalDocsDesc', 'Joignez les trois pièces justificatives requises (PDF ou image, 5 Mo max chacune) avant l’envoi définitif.')}
              </p>

              <div className="space-y-3.5">
                {REQUIRED_ADMISSION_DOCUMENTS.map((category, index) => {
                  const document = uploadedFiles.find((file) => file.category === category);
                  const documentUrl = document?.url || document?.data;
                  return (
                    <div key={category} className="rounded-xl border border-slate-200 p-3">
                      <label className="block text-xs font-bold text-slate-700">
                        {index + 1}. {category}
                      </label>
                      {document ? (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-xs text-emerald-800" title={document.name}>
                            {document.name}
                          </span>
                          {documentUrl ? (
                            <a
                              href={documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              <Eye size={13} />
                              Voir
                            </a>
                          ) : (
                            <span className="shrink-0 text-xs text-slate-500">Aperçu indisponible</span>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">Aucune pièce jointe.</p>
                      )}
                      <label className="mt-3 block cursor-pointer text-xs font-semibold text-blue-700 hover:text-blue-800">
                        {document ? 'Remplacer cette pièce' : 'Ajouter cette pièce'}
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={(event) => handleFileUpload(event, category)}
                            className="mt-1.5 block w-full cursor-pointer text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>

              {uploadError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-800">{uploadError}</p>}

              {uploadedFiles.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Documents prêts ({uploadedFiles.length})</span>
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                      <span className="truncate font-medium">{f.name}</span>
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
          )}
        </section>
      )}
    </main>
  );
}
