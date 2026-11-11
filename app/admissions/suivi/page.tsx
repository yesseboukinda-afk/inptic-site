'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock3,
  CreditCard,
  FileCheck2,
  FileText,
  Printer,
  QrCode,
  ShieldCheck,
  X,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { generateQRCodeSVG } from '@/lib/qrcode';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth-client';
import AdmissionJourneyNavigation from '@/components/AdmissionJourneyNavigation';
import {
  hasCompletedAdmissionPreRegistration,
  hasCompleteAdmissionDossier,
  REQUIRED_ADMISSION_DOCUMENTS,
} from '@/lib/admissionsWorkflow';

type Notification = {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  createdAt: string;
};

type ProfileDocument = {
  name: string;
  type: string;
  category?: string;
  data?: string;
  url?: string;
};

type CandidateProfile = {
  name: string;
  email: string;
  phone?: string;
  niveau?: string;
  parcours?: string;
  promotion?: string;
  etablissement?: string;
  annee?: string;
  specialite?: string;
  diplome?: string;
  photo?: string;
  documents?: ProfileDocument[];
  filiere?: string;
  dossierNumero?: string;
  dossierStep?: 'inscription' | 'en_attente' | 'valide' | 'refuse';
  dossierValide?: boolean;
  status?: 'inscription' | 'en_attente' | 'valide' | 'refuse';
  notifications?: Notification[];
  role?: string;
  // Accusé de réception & Paiement
  accuseReceptionDate?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  paymentOperator?: 'airtel' | 'moov' | '';
  paymentPhone?: string;
  paymentAmount?: number;
  paymentTransactionId?: string;
  paymentReference?: string;
  paymentDate?: string;
  admissionWorkflow?: {
    preRegistration?: {
      concoursSlug?: string;
      completedAt?: string;
    };
    applicationCompletedAt?: string;
    payment?: {
      status?: 'pending' | 'paid' | 'failed';
      transactionId?: string;
      reference?: string;
      paidAt?: string;
    };
  };
  candidatureData?: Record<string, unknown>;
};

type JourneyStep = {
  title: string;
  description: string;
  state: 'done' | 'current' | 'upcoming' | 'attention';
};

export default function Suivi() {
  const router = useRouter();
  const { t } = useTranslation();

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [showQuittanceModal, setShowQuittanceModal] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<ProfileDocument | null>(null);

  useEffect(() => {
    let active = true;
    let syncing = false;
    const syncProfile = async () => {
      if (syncing) return;
      syncing = true;
      try {
        const storedRaw = localStorage.getItem('inptic_user');
        let stored: CandidateProfile | null = null;
        try {
          stored = storedRaw ? JSON.parse(storedRaw) as CandidateProfile : null;
        } catch {
          stored = null;
        }

        const { data, error } = await authClient.auth.getSession();
        if (error) throw error;
        const authUser = data.session?.user;
        if (!authUser?.email) {
          router.replace('/candidat');
          return;
        }

        const response = await fetch('/api/candidat/profile', { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Impossible d’actualiser votre dossier.');
        const remote = Array.isArray(payload.profiles)
          ? payload.profiles.find((item: CandidateProfile) => item.email?.toLowerCase() === authUser.email?.toLowerCase()) as CandidateProfile | undefined
          : undefined;
        const remoteWorkflow = remote?.admissionWorkflow;
        const metadataName = typeof authUser.user_metadata?.full_name === 'string'
          ? authUser.user_metadata.full_name
          : typeof authUser.user_metadata?.name === 'string'
            ? authUser.user_metadata.name
            : 'Candidat';
        const merged: CandidateProfile = {
          ...stored,
          ...remote,
          email: authUser.email,
          name: remote?.name || stored?.name || metadataName,
          documents: remote?.documents ?? stored?.documents ?? [],
          admissionWorkflow: remoteWorkflow ?? stored?.admissionWorkflow ?? {},
          paymentStatus: remote?.paymentStatus ?? remoteWorkflow?.payment?.status ?? stored?.paymentStatus,
          paymentTransactionId: remote?.paymentTransactionId ?? remoteWorkflow?.payment?.transactionId ?? stored?.paymentTransactionId,
          paymentReference: remote?.paymentReference ?? remoteWorkflow?.payment?.reference ?? stored?.paymentReference,
          paymentDate: remote?.paymentDate ?? remoteWorkflow?.payment?.paidAt ?? stored?.paymentDate,
        };

        let refreshWarning = '';
        const payment = merged.admissionWorkflow?.payment;
        if (payment?.status === 'pending' && payment.transactionId) {
          const paymentResponse = await fetch(
            `/api/payment/status?transactionId=${encodeURIComponent(payment.transactionId)}`,
            { cache: 'no-store' },
          );
          const paymentPayload = await paymentResponse.json().catch(() => ({}));
          if (paymentResponse.ok && paymentPayload.success) {
            merged.paymentStatus = paymentPayload.status === 'success'
              ? 'paid'
              : paymentPayload.status === 'failed' ? 'failed' : 'pending';
            if (paymentPayload.status === 'success') {
              merged.paymentDate = new Date().toISOString();
              merged.admissionWorkflow = {
                ...merged.admissionWorkflow,
                payment: { ...payment, status: 'paid', paidAt: merged.paymentDate },
              };
            }
          } else if (!paymentResponse.ok) {
            refreshWarning = paymentPayload.error || 'Le statut du paiement ne peut pas être actualisé momentanément.';
          }
        }

        if (!active) return;
        localStorage.setItem('inptic_user', JSON.stringify(merged));
        setProfile(merged);
        setLastUpdatedAt(new Date());
        setLoadError(refreshWarning);
      } catch (error) {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : 'Impossible d’actualiser votre dossier.');
      } finally {
        syncing = false;
        if (active) setLoading(false);
      }
    };

    void syncProfile();
    const refreshInterval = window.setInterval(() => void syncProfile(), 15_000);
    window.addEventListener('focus', syncProfile);
    window.addEventListener('auth-state-changed', syncProfile);
    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', syncProfile);
      window.removeEventListener('auth-state-changed', syncProfile);
    };
  }, [router]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Chargement de votre espace de suivi...</p>
      </main>
    );
  }
  if (!profile) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="max-w-lg rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-black text-slate-900">Suivi temporairement indisponible</h1>
          <p className="mt-2 text-sm text-slate-600">
            {loadError || 'Connectez-vous à votre compte candidat pour afficher votre avancement.'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">
              Réessayer
            </button>
            <Link href="/candidat" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700">
              Connexion
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isPaid = profile.paymentStatus === 'paid';
  const isValide = profile.status === 'valide' || profile.dossierValide;
  const isRefuse = profile.status === 'refuse';
  const isPreRegistered = hasCompletedAdmissionPreRegistration(profile);
  const isApplicationComplete = hasCompleteAdmissionDossier(profile);
  const completedJourneySteps = [
    'account' as const,
    ...(isPreRegistered ? ['opening' as const, 'contest' as const, 'preRegistration' as const] : []),
    ...(isApplicationComplete ? ['dossier' as const] : []),
    ...(isPaid ? ['payment' as const] : []),
  ];
  const currentJourneyStep = !isPreRegistered
    ? 'preRegistration'
    : !isApplicationComplete
        ? 'dossier'
        : !isPaid
          ? 'payment'
          : undefined;
  const uploadedCategories = new Set(
    (profile.documents || []).map((document) => document.category || document.name.split(' - ')[0]),
  );
  const missingDocuments = REQUIRED_ADMISSION_DOCUMENTS.filter((category) => !uploadedCategories.has(category));
  const concoursSlug = profile.admissionWorkflow?.preRegistration?.concoursSlug || '';
  const nextStep = !isPreRegistered
    ? { message: 'La session ouverte sera sélectionnée automatiquement. Effectuez votre préinscription pour commencer le dépôt du dossier.', href: '/admissions/depot', label: 'Me préinscrire' }
    : isRefuse
      ? { message: 'La Scolarité a rendu une décision sur votre dossier. Consultez les notifications reçues ou contactez le service pour connaître la suite.', href: null, label: '' }
      : !isApplicationComplete
        ? { message: missingDocuments.length
            ? `Votre dossier est incomplet : ajoutez ${missingDocuments.join(', ')} et enregistrez le formulaire complet.`
            : 'Complétez puis enregistrez tous les champs obligatoires du formulaire pour débloquer le paiement.',
          href: `/admissions/depot?concours=${encodeURIComponent(concoursSlug)}`,
          label: 'Continuer le dépôt du dossier' }
        : !isPaid
          ? { message: 'Votre dossier complet est enregistré. Le paiement des frais est maintenant disponible.', href: `/admissions/paiement?concours=${encodeURIComponent(concoursSlug)}`, label: 'Procéder au paiement' }
          : !isValide
            ? { message: 'Votre paiement est enregistré. Votre dossier est en attente de vérification finale par la Scolarité.', href: null, label: '' }
            : { message: 'Toutes les étapes sont terminées. Votre dossier est validé par la Scolarité.', href: null, label: '' };
  const journeySteps: JourneyStep[] = [
    { title: 'Création du compte candidat', description: 'Compte créé', state: 'done' },
    { title: 'Activation du compte', description: 'Adresse e-mail vérifiée', state: 'done' },
    {
      title: 'Session ouverte automatiquement',
      description: isPreRegistered ? 'Session rattachée à votre candidature' : 'En attente de la session ouverte',
      state: isPreRegistered ? 'done' : 'current',
    },
    {
      title: 'Préinscription au concours',
      description: isPreRegistered ? `Enregistrée${profile.admissionWorkflow?.preRegistration?.completedAt ? ` le ${new Date(profile.admissionWorkflow.preRegistration.completedAt).toLocaleDateString('fr-GA')}` : ''}` : 'À effectuer lorsque la session est ouverte',
      state: isPreRegistered ? 'done' : 'upcoming',
    },
    {
      title: 'Dépôt du dossier (étape 5)',
      description: isApplicationComplete
        ? 'Formulaire enregistré et pièces obligatoires jointes'
        : `${uploadedCategories.size} / ${REQUIRED_ADMISSION_DOCUMENTS.length} pièces jointes — formulaire à compléter et enregistrer`,
      state: !isPreRegistered ? 'upcoming' : isApplicationComplete ? 'done' : 'current',
    },
    {
      title: 'Paiement des frais (étape 6)',
      description: isPaid ? 'Paiement confirmé' : profile.paymentStatus === 'pending' ? 'Confirmation en attente' : profile.paymentStatus === 'failed' ? 'Paiement refusé ou échoué' : 'En attente',
      state: isPaid ? 'done' : !isApplicationComplete ? 'upcoming' : profile.paymentStatus === 'failed' ? 'attention' : 'current',
    },
    {
      title: 'Vérification finale par la Scolarité',
      description: isValide ? 'Dossier validé' : isRefuse ? 'Dossier refusé' : isPaid ? 'En attente de décision' : 'Après le paiement',
      state: isValide ? 'done' : isRefuse ? 'attention' : isPaid ? 'current' : 'upcoming',
    },
  ];

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'https://inptic.ga');
  const verificationUrl = `${siteUrl}/quittance/${profile.paymentReference || profile.paymentTransactionId || 'OFFICIEL'}`;
  const quittanceQrSvg = generateQRCodeSVG(verificationUrl, { size: 160 });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* ── BANNIÈRE HÉRO SUIVI ── */}
      <section className="relative isolate overflow-hidden text-white bg-slate-950">
        <img src="/banniere/page-suivi-admissions.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.88) 30%, rgba(15, 23, 42, 0.48) 50%, rgba(30, 136, 168, 0.16) 75%, rgba(30, 136, 168, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <img src="/logoinptic.ico" alt="Logo INPTIC" className="mb-4 h-9 w-auto object-contain object-left" />
          <h1 className="text-4xl font-black md:text-6xl">{t('suiviPage.title', 'Suivi de Candidature & Quittance')}</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-200">
            {t('suiviPage.intro', "Consultez votre accusé de réception, procédez au règlement des frais de dossier et téléchargez votre quittance officielle d'authenticité.")}
          </p>
        </div>
      </section>

      <section className="py-8">
        <AdmissionJourneyNavigation
          current={currentJourneyStep}
          completed={completedJourneySteps}
          paymentUnlocked={isApplicationComplete}
        />
      </section>

      <section className="container-x mt-8 px-4 md:px-0 max-w-4xl mx-auto space-y-6">
        {loadError && (
          <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-bold">Actualisation temporairement indisponible</p>
            <p className="mt-1">{loadError}</p>
          </div>
        )}

        <div
          role="status"
          className={`rounded-2xl border p-5 ${
            isRefuse ? 'border-rose-300 bg-rose-50 text-rose-950'
              : isValide ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                : isPaid && !isValide ? 'border-blue-300 bg-blue-50 text-blue-950'
                  : 'border-amber-300 bg-amber-50 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={21} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <h2 className="font-black">État actuel de votre dossier</h2>
              <p className="mt-1 text-sm leading-relaxed">{nextStep.message}</p>
              {nextStep.href && (
                <Link
                  href={nextStep.href}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                >
                  {nextStep.label} <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-1 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Étapes de votre candidature</h2>
              <p className="text-sm text-slate-500">Le statut est actualisé automatiquement pendant que cette page reste ouverte.</p>
            </div>
            <p className="text-xs text-slate-500">
              {lastUpdatedAt ? `Dernière actualisation : ${lastUpdatedAt.toLocaleTimeString('fr-GA')}` : 'Actualisation en cours…'}
            </p>
          </div>
          <ol className="space-y-3">
            {journeySteps.map((step, index) => (
              <li
                key={step.title}
                className={`flex items-start gap-3 rounded-2xl border p-4 ${
                  step.state === 'done' ? 'border-emerald-200 bg-emerald-50/60'
                    : step.state === 'attention' ? 'border-rose-200 bg-rose-50'
                      : step.state === 'current' ? 'border-blue-200 bg-blue-50'
                        : 'border-slate-200 bg-slate-50'
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {step.state === 'done'
                    ? <CheckCircle2 size={20} className="text-emerald-600" />
                    : step.state === 'attention'
                      ? <AlertCircle size={20} className="text-rose-600" />
                      : step.state === 'current'
                        ? <Clock3 size={20} className="text-blue-700" />
                        : <Circle size={20} className="text-slate-400" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{index + 1}. {step.title}</h3>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      {step.state === 'done' ? 'Terminé' : step.state === 'attention' ? 'Action requise' : step.state === 'current' ? 'En cours' : 'À venir'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {isApplicationComplete && (
          <>
        {/* ── CARD ACCUSÉ DE RÉCEPTION ── */}
        <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shrink-0">
                <FileCheck2 size={24} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">{t('suiviPage.officialReceipt', 'Accusé de Réception Officiel')}</span>
                <h2 className="text-xl font-black text-slate-900">{profile.name || 'Candidat'}</h2>
                <p className="text-xs text-slate-500">{t('suiviPage.dossierNumber', 'Dossier N° :')} <strong className="font-mono text-blue-700">{profile.dossierNumero || 'INPTIC-2026-000000'}</strong></p>
              </div>
            </div>

            <span className={`rounded-full px-3 py-1 text-xs font-bold ${isValide ? 'bg-emerald-100 text-emerald-800' : isRefuse ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
              {isValide ? t('suiviPage.validated', 'Dossier Validé') : isRefuse ? t('suiviPage.refused', 'Dossier Refusé') : t('suiviPage.underReview', "En cours d'examen par la Scolarité")}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-slate-400">{t('suiviPage.requestedProgram', 'Filière sollicitée')}</span>
              <p className="font-bold text-slate-800 mt-0.5">{profile.filiere || 'Licence Professionnelle'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-slate-400">{t('suiviPage.receptionDate', 'Réception du dossier')}</span>
              <p className="font-bold text-slate-800 mt-0.5">
                {profile.accuseReceptionDate ? new Date(profile.accuseReceptionDate).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-slate-400">{t('suiviPage.paymentStatus', 'Statut de paiement')}</span>
              <p className={`font-bold mt-0.5 ${isPaid ? 'text-emerald-700' : 'text-amber-600'}`}>
                {isPaid ? t('suiviPage.paidStatus', 'Payé (20 000 FCFA)') : t('suiviPage.pendingPaymentStatus', 'Autorisé - En attente de règlement')}
              </p>
            </div>
          </div>
        </div>

        {/* ── MODULE DE PAIEMENT OU ACCÈS QUITTANCE ── */}
        {!isPaid ? (
          <div className="rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50/60 to-white p-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37] text-slate-950 font-black shadow">
                <CreditCard size={24} />
              </div>
              <div className="flex-1">
                <h3 className="mt-2 text-xl font-black text-slate-900">
                  Règlement des frais de dossier
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Le paiement Mobile Money est disponible après la préinscription et l’enregistrement complet de votre dossier.
                </p>
                <Link
                  href={`/admissions/paiement?concours=${encodeURIComponent(profile.admissionWorkflow?.preRegistration?.concoursSlug || '')}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Continuer vers le paiement <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ── ACCÈS À LA QUITTANCE OFFICIELLE LORSQUE PAYÉ ── */
          <div className="rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black shrink-0 shadow">
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <span className="inline-block rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
                    Paiement validé &amp; certifié
                  </span>
                  <h3 className="mt-1 text-lg font-black text-slate-900">
                    Quittance Officielle de Paiement Disponible
                  </h3>
                  <p className="text-xs text-slate-600">
                    Référence : <strong className="font-mono text-emerald-900">{profile.paymentReference}</strong> • Réglé le {new Date(profile.paymentDate!).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowQuittanceModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow"
              >
                <QrCode size={16} className="text-[#D4AF37]" />
                <span>Voir ma quittance officielle (PDF / QR)</span>
              </button>
            </div>
          </div>
        )}
          </>
        )}

        {/* ── PIÈCES JOINTES SOUMISES ── */}
        {profile.documents && profile.documents.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Pièces justificatives déposées</h3>
            <div className="mt-3 space-y-2">
              {profile.documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={16} className="text-blue-600 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{doc.name}</span>
                  </div>
                  {doc.data || doc.url ? (
                    <button
                      type="button"
                      onClick={() => setViewingDocument(doc)}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition"
                    >
                      <Eye size={13} />
                      Voir
                    </button>
                  ) : (
                    <span className="text-slate-400 italic">Déposé</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── MODAL DIALOGUE D'AFFICHAGE DE LA QUITTANCE OFFICIELLE INPTIC ── */}
      {showQuittanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-3 sm:p-6 backdrop-blur-sm">
          <div className="relative my-4 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl print:p-0 print:shadow-none">
            <button
              onClick={() => setShowQuittanceModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 print:hidden"
            >
              <X size={20} />
            </button>

            {/* Document de quittance officielle */}
            <div className="border-4 border-slate-900 p-6 rounded-2xl bg-white text-slate-900 space-y-6">
              {/* En-tête officiel */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 text-center sm:text-left">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-900">République Gabonaise</p>
                  <p className="text-[10px] font-bold text-slate-600">INPTIC Gabon • Direction de la Scolarité</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">QUITTANCE DE PAIEMENT OFFICIELLE</h2>
                </div>
                <div className="hidden sm:block text-right">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-lg">
                    CERTIFIÉ PAYÉ
                  </span>
                </div>
              </div>

              {/* Infos candidat & Transaction */}
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="space-y-1.5 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Informations du Candidat</span>
                  <p className="font-black text-sm text-slate-900">{profile.name}</p>
                  <p className="text-slate-600">Email : {profile.email}</p>
                  <p className="text-slate-600">Téléphone : {profile.phone || 'N/A'}</p>
                  <p className="text-slate-600">Dossier N° : <strong className="font-mono text-blue-700">{profile.dossierNumero}</strong></p>
                  <p className="text-slate-600">Filière : {profile.filiere}</p>
                </div>

                <div className="space-y-1.5 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Détails du Règlement</span>
                  <p className="font-bold text-slate-800">Montant : <span className="text-emerald-700 font-black text-sm">20 000 FCFA</span></p>
                  <p className="text-slate-600">Opérateur : <strong className="uppercase">{profile.paymentOperator || 'Mobile Money'}</strong></p>
                  <p className="text-slate-600">Transaction ID : <span className="font-mono">{profile.paymentTransactionId}</span></p>
                  <p className="text-slate-600">Référence : <span className="font-mono text-blue-800 font-bold">{profile.paymentReference}</span></p>
                  <p className="text-slate-600">Date : {profile.paymentDate ? new Date(profile.paymentDate).toLocaleString('fr-FR') : 'N/A'}</p>
                </div>
              </div>

              {/* QR Code d'Authenticité & Cachet */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center gap-4">
                  <div
                    className="p-1.5 bg-white rounded-xl shadow-sm border border-slate-200 shrink-0"
                    dangerouslySetInnerHTML={{ __html: quittanceQrSvg }}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <ShieldCheck size={15} className="text-emerald-600" />
                      QR Code d&apos;Authenticité
                    </span>
                    <p className="mt-1 text-[10px] text-slate-500 leading-tight">
                      Ce QR code certifie l&apos;authenticité du règlement auprès de la scolarité de l&apos;INPTIC.
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Le Chef du Service Scolarité</p>
                  <p className="mt-4 text-xs font-black text-slate-900 italic">INPTIC Gabon</p>
                </div>
              </div>

              {/* Actions d'impression */}
              <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-600 transition shadow"
                >
                  <Printer size={15} />
                  <span>Imprimer / Télécharger la Quittance</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PRÉVISUALISATION DES DOCUMENTS (BOÎTE DE DIALOGUE) ── */}
      {viewingDocument && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative flex flex-col h-[88vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-900 truncate">{viewingDocument.name}</h3>
              <button
                onClick={() => setViewingDocument(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-4 overflow-hidden flex items-center justify-center">
              {viewingDocument.type?.includes('image') || (viewingDocument.data && viewingDocument.data.startsWith('data:image')) ? (
                <img src={viewingDocument.data || viewingDocument.url} alt={viewingDocument.name} className="max-h-full max-w-full object-contain rounded-xl shadow" />
              ) : (
                <iframe src={viewingDocument.data || viewingDocument.url} title={viewingDocument.name} className="h-full w-full rounded-xl border border-slate-200 bg-white shadow" />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
