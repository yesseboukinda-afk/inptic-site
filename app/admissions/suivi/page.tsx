'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { translateNotification } from '@/lib/authMessages';

type Notification = {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  createdAt: string;
};

type ProfileDocument = {
  name: string;
  type: string;
  data?: string;
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
  bio?: string;
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
};

const filieres = [
  'Management des TIC',
  'Réseaux et Systèmes Numériques',
  'Audiovisuel',
  'Formations qualifiantes',
  'Formations certifiantes',
];

const addNotification = (existing: Notification[] | undefined, message: string, type: Notification['type'] = 'info') => [
  {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    type,
    createdAt: new Date().toISOString(),
  },
  ...(Array.isArray(existing) ? existing : []),
];

const compactDocuments = (documents?: ProfileDocument[]) =>
  (documents ?? []).map(({ name, type, data }) => ({ name, type, data }));

const saveProfileSafely = (payload: CandidateProfile) => {
  const compacted = {
    ...payload,
    documents: compactDocuments(payload.documents),
  };

  try {
    localStorage.setItem(`inptic_documents_${payload.email.toLowerCase()}`, JSON.stringify(payload.documents ?? []));
  } catch {
    // Keep the compact profile when the browser quota cannot store document previews.
  }

  try {
    localStorage.setItem('inptic_user', JSON.stringify(compacted));

    const storedProfiles = JSON.parse(localStorage.getItem('inptic_users') || '[]');
    const nextProfiles = Array.isArray(storedProfiles)
      ? storedProfiles.map((entry: CandidateProfile) =>
          entry.email === compacted.email ? { ...entry, ...compacted, documents: compactDocuments(compacted.documents) } : entry
        )
      : [{ ...compacted, role: 'etudiant' }];

    localStorage.setItem('inptic_users', JSON.stringify(nextProfiles));
    window.dispatchEvent(new Event('auth-state-changed'));
    return;
  } catch {
    const fallback = {
      ...payload,
      documents: compactDocuments(payload.documents),
    };

    try {
      localStorage.setItem('inptic_user', JSON.stringify(fallback));
    } catch {
      // Storage is still saturated; we keep the in-memory state and skip a second heavy payload.
    }

    try {
      const storedProfiles = JSON.parse(localStorage.getItem('inptic_users') || '[]');
      const nextProfiles = Array.isArray(storedProfiles)
        ? storedProfiles.map((entry: CandidateProfile) =>
            entry.email === fallback.email ? { ...entry, ...fallback, documents: compactDocuments(fallback.documents) } : entry
          )
        : [{ ...fallback, role: 'etudiant' }];

      localStorage.setItem('inptic_users', JSON.stringify(nextProfiles));
    } catch {
      // Ignore: the browser quota is exhausted, so we keep only the essential state.
    }

    window.dispatchEvent(new Event('auth-state-changed'));
  }
};

const defaultForm = (stored: Partial<CandidateProfile>) => ({
  name: stored.name || '',
  email: stored.email || '',
  phone: stored.phone || '',
  niveau: stored.niveau || '',
  parcours: stored.parcours || '',
  promotion: stored.promotion || '',
  etablissement: stored.etablissement || '',
  annee: stored.annee || '',
  specialite: stored.specialite || '',
  filiere: stored.filiere || '',
  bio: stored.bio || '',
  diplome: stored.diplome || '',
  documents: Array.isArray(stored.documents) ? stored.documents : [],
  dossierNumero: stored.dossierNumero || 'INPTIC-000000',
});

type PaymentStatus = 'idle' | 'initiating' | 'pending' | 'success' | 'failed';

export default function Suivi() {
  const { t } = useTranslation();
  const router = useRouter();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [form, setForm] = useState(defaultForm({}));
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentOperator, setPaymentOperator] = useState<'airtel' | 'moov' | ''>('');
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [paymentStatusMessage, setPaymentStatusMessage] = useState('');

  const pollingRef = useRef<{ intervalId?: ReturnType<typeof setInterval>; attempts: number }>({ attempts: 0 });

  useEffect(() => {
    const storedRaw = localStorage.getItem('inptic_user');
    if (!storedRaw) {
      router.replace('/candidat');
      return;
    }

    try {
      const stored = JSON.parse(storedRaw) as CandidateProfile;
      if (stored?.dossierValide === true || stored?.status === 'valide') {
        router.replace('/vie-etudiante');
        return;
      }

      setProfile(stored);
      setForm(defaultForm(stored));
      setReady(true);
    } catch {
      localStorage.removeItem('inptic_user');
      router.replace('/candidat');
    }
  }, [router]);

  useEffect(() => {
    if (!profile) return;
    if (profile.dossierValide === true || profile.status === 'valide') {
      router.replace('/vie-etudiante');
    }
  }, [profile, router]);

  const stopPolling = () => {
    if (pollingRef.current.intervalId) {
      clearInterval(pollingRef.current.intervalId);
      pollingRef.current.intervalId = undefined;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const dossierStatus = profile?.status === 'valide'
    ? 'Validé'
    : profile?.status === 'refuse'
      ? 'Refusé'
      : 'En attente de validation';

  const currentStepIndex = profile?.status === 'valide' || profile?.status === 'refuse' ? 2 : 1;

  const updateStoredProfile = (nextProfile: CandidateProfile) => {
    saveProfileSafely(nextProfile);
  };

  const handleChange = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleDocumentsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    Promise.all(
      files.map(
        (file) =>
          new Promise<ProfileDocument>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                type: file.type || 'application/octet-stream',
                data: typeof reader.result === 'string' ? reader.result : '',
              });
            };
            reader.onerror = () => reject(new Error(`Impossible de lire ${file.name}`));
            reader.readAsDataURL(file);
          })
      )
    )
      .then((uploaded) => {
        setForm((current) => ({
          ...current,
          documents: [...current.documents, ...uploaded],
        }));
      })
      .catch(() => {
        setMessage('Le téléchargement d’un ou plusieurs justificatifs a échoué.');
      });

    event.target.value = '';
  };

  const saveDossier = async (event: FormEvent) => {
    event.preventDefault();

    if (!profile) return;

    if (!form.filiere) {
      setMessage('Veuillez sélectionner une filière avant de soumettre votre dossier.');
      return;
    }

    if (!form.documents.length) {
      setMessage('Veuillez téléverser au moins un justificatif pour finaliser votre dossier.');
      return;
    }

    // Ouvrir le modal de paiement avant la soumission
    setPaymentPhone(form.phone || '');
    setPaymentOperator('');
    setPaymentError('');
    setPaymentStatus('idle');
    setPaymentStatusMessage('');
    setIsPaymentModalOpen(true);
  };

  const finalizeDossierSubmission = async (transactionId: string, provider: 'airtel' | 'moov', reference: string) => {
    if (!profile) return;

    const nextProfile: CandidateProfile = {
      ...profile,
      ...form,
      documents: form.documents,
      filiere: form.filiere,
      dossierNumero: profile.dossierNumero || form.dossierNumero || 'INPTIC-000000',
      dossierStep: 'en_attente',
      dossierValide: false,
      status: 'en_attente',
      notifications: addNotification(
        profile.notifications,
        'Votre dossier a été soumis avec succès après paiement. Il est en cours de validation.',
        'success'
      ),
    };

    updateStoredProfile(nextProfile);
    setProfile(nextProfile);
    setPaymentStatus('success');
    setIsPaymentModalOpen(false);
    setIsDossierModalOpen(false);
    setMessage('Paiement et dossier transmis avec succès. Vous serez notifié dès validation.');

    try {
      const response = await fetch('/api/candidat/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nextProfile,
          paymentTransactionId: transactionId,
          paymentProvider: provider,
          paymentReference: reference,
          documents: (nextProfile.documents ?? []).map((document) => ({
            name: document.name,
            type: document.type,
            data: document.data || undefined,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setMessage(errorData?.error || 'Le dossier n’a pas pu être enregistré en base.');
      }
    } catch {
      // local-only fallback already saved
    }
  };

  const pollPaymentStatus = (transactionId: string, provider: 'airtel' | 'moov', reference: string) => {
    pollingRef.current.attempts = 0;
    const maxAttempts = 20; // ~60s a raison d'un appel toutes les 3s

    const intervalId = setInterval(async () => {
      pollingRef.current.attempts += 1;

      try {
        const res = await fetch(`/api/payment/status?transactionId=${encodeURIComponent(transactionId)}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));

        if (data?.status === 'success') {
          stopPolling();
          setIsPaymentLoading(false);
          await finalizeDossierSubmission(transactionId, provider, reference);
          return;
        }

        if (data?.status === 'failed') {
          stopPolling();
          setIsPaymentLoading(false);
          setPaymentStatus('failed');
          setPaymentError(data?.statusMessage || 'Le paiement a été refusé ou annulé.');
          return;
        }

        setPaymentStatusMessage(data?.statusMessage || 'En attente de confirmation sur votre téléphone…');
      } catch {
        // on ignore les erreurs réseau transitoires pendant le polling
      }

      if (pollingRef.current.attempts >= maxAttempts) {
        stopPolling();
        setIsPaymentLoading(false);
        setPaymentStatus('failed');
        setPaymentError('Délai d’attente dépassé. Vérifiez votre téléphone puis réessayez.');
      }
    }, 3000);

    pollingRef.current.intervalId = intervalId;
  };

  const submitWithPayment = async () => {
    if (!profile) return;

    if (!paymentOperator) {
      setPaymentError('Veuillez sélectionner un opérateur de paiement.');
      return;
    }

    if (!paymentPhone || paymentPhone.trim().length < 8) {
      setPaymentError('Veuillez entrer un numéro de téléphone valide (min. 8 chiffres).');
      return;
    }

    setIsPaymentLoading(true);
    setPaymentError('');
    setPaymentStatus('initiating');

    try {
      const paymentRef = `INPTIC-${profile.dossierNumero || form.dossierNumero}-${Date.now()}`;

      const paymentRes = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 20000,
          phone: paymentPhone.trim(),
          operator: paymentOperator,
          reference: paymentRef,
          description: 'Frais de dossier concours INPTIC',
        }),
      });

      const data = await paymentRes.json().catch(() => ({}));

      if (!paymentRes.ok || !data?.success || !data?.transactionId) {
        setPaymentError(data?.error || 'Le paiement a échoué. Veuillez réessayer.');
        setIsPaymentLoading(false);
        setPaymentStatus('failed');
        return;
      }

      setPaymentStatus('pending');
      setPaymentStatusMessage(data?.message || 'Validez la demande sur votre téléphone.');
      pollPaymentStatus(data.transactionId, paymentOperator, paymentRef);
    } catch {
      setPaymentError('Une erreur est survenue lors du paiement. Veuillez réessayer.');
      setIsPaymentLoading(false);
      setPaymentStatus('failed');
    }
  };

  if (!ready || !profile) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100">
        <p className="text-slate-600">{t('pages.loading')}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img src="/banniere/2.webp" alt="" fetchPriority="high" loading="eager" decoding="async" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">{t('pages.admissions')}</p>
          <h1 className="text-4xl font-black md:text-6xl">{t('pages.tracking')}</h1>
          <p className="mt-5 max-w-3xl text-lg text-blue-50">
            {t('application.intro')}
          </p>
          <div className="mt-6 inline-flex rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-blue-50">
            {t('application.session')}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{t('application.status')}</h2>
                  <p className="mt-1 text-sm text-slate-500">{t('application.step', { current: currentStepIndex + 1 })}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                    dossierStatus === 'Validé'
                      ? 'bg-green-100 text-green-700'
                      : dossierStatus === 'Refusé'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {dossierStatus}
                </span>
              </div>

              <div className="relative mt-6 space-y-4 border-l-2 border-slate-200 pl-6">
                {[
                  { label: t('application.registration'), active: currentStepIndex >= 0 },
                  { label: t('application.file'), active: currentStepIndex >= 1 },
                  { label: t('application.validation'), active: currentStepIndex >= 2 },
                ].map((step, index) => (
                  <div
                    key={step.label}
                    className={`relative flex items-center py-1 ${step.active ? 'text-blue-800' : 'text-slate-500'}`}
                  >
                    <span className={`absolute -left-[2.625rem] flex h-9 w-9 items-center justify-center rounded-full border-4 border-white font-bold ${step.active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{index + 1}</span>
                    <p className="font-semibold">{step.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{t('application.student')}</p>
                  <p className="mt-2 font-semibold text-slate-900">{profile.name || t('application.student')}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{t('application.fileNumber')}</p>
                  <p className="mt-2 font-semibold text-slate-900">{profile.dossierNumero || form.dossierNumero}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">{t('application.applicationFile')}</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">{t('application.complete')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDossierModalOpen(true)}
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {t('application.openForm')}
              </button>
            </div>

            {isDossierModalOpen && (
              <div
                className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dossier-modal-title"
                onClick={() => setIsDossierModalOpen(false)}
              >
                <div
                  className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">{t('application.applicationFile')}</p>
                      <h3 id="dossier-modal-title" className="mt-1 text-2xl font-bold text-slate-900">{t('application.complete')}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDossierModalOpen(false)}
                      aria-label={t('application.closeForm')}
                      className="rounded-lg p-2 text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={saveDossier}>
                    <div className="mt-6 border-b border-slate-200 pb-5">
                      <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">1. {t('application.identity')}</p>
                      <p className="mt-1 text-sm text-slate-500">{t('application.identityHelp')}</p>
                    </div>

                    <div className="mt-6 grid gap-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">{t('application.fullName')}</span>
                          <input
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">{t('application.email')}</span>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>
                      </div>

                      <div className="md:col-span-2 border-t border-slate-200 pt-5">
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">2. {t('application.program')}</p>
                        <p className="mt-1 text-sm text-slate-500">{t('application.programHelp')}</p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">{t('application.phone')}</span>
                          <input
                            value={form.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">{t('application.level')}</span>
                          <input
                            value={form.niveau}
                            onChange={(e) => handleChange('niveau', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">{t('application.path')}</span>
                          <input
                            value={form.parcours}
                            onChange={(e) => handleChange('parcours', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">{t('application.track')}</span>
                          <select
                            value={form.filiere}
                            onChange={(e) => handleChange('filiere', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="">{t('application.selectTrack')}</option>
                            {filieres.map((filiere) => (
                              <option key={filiere} value={filiere}>{filiere}</option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">{t('application.institution')}</span>
                          <input
                            value={form.etablissement}
                            onChange={(e) => handleChange('etablissement', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">{t('application.cohort')}</span>
                          <input
                            value={form.promotion}
                            onChange={(e) => handleChange('promotion', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">{t('application.year')}</span>
                          <input
                            value={form.annee}
                            onChange={(e) => handleChange('annee', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">{t('application.specialty')}</span>
                          <input
                            value={form.specialite}
                            onChange={(e) => handleChange('specialite', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">{t('application.diploma')}</span>
                        <input
                          value={form.diplome}
                          onChange={(e) => handleChange('diplome', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-medium text-slate-700">{t('application.motivation')}</span>
                        <textarea
                          value={form.bio}
                          onChange={(e) => handleChange('bio', e.target.value)}
                          rows={4}
                          className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>

                      <div className="md:col-span-2 border-t border-slate-200 pt-5">
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">3. {t('application.documents')}</p>
                        <p className="mt-1 text-sm text-slate-500">{t('application.documentsHelp')}</p>
                      </div>

                      <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">{t('application.uploadDocuments')}</span>
                          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleDocumentsChange} className="w-full" />
                        </label>

                        {form.documents.length ? (
                          <ul className="mt-4 space-y-2 text-sm text-slate-700">
                            {form.documents.map((document, index) => (
                              <li key={`${document.name}-${index}`} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
                                <span className="truncate">{document.name}</span>
                                <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">
                                  {document.type.includes('pdf') ? 'PDF' : 'Fichier'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-slate-500">{t('application.noDocuments')}</p>
                        )}
                      </div>
                    </div>

                    {message && <p className="mt-4 text-sm text-blue-700">{message}</p>}

                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Soumettre le dossier
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isPaymentModalOpen && (
              <div
                className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="payment-modal-title"
                onClick={() => {
                  if (!isPaymentLoading) setIsPaymentModalOpen(false);
                }}
              >
                <div
                  className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl md:p-8"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Frais de dossier</p>
                      <h3 id="payment-modal-title" className="mt-1 text-2xl font-bold text-slate-900">Paiement Mobile Money</h3>
                    </div>
                    {!isPaymentLoading && (
                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(false)}
                        aria-label="Fermer le paiement"
                        className="rounded-lg p-2 text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <p className="mb-4 text-sm text-slate-600">
                    Un montant de <span className="font-semibold text-slate-900">20 000 FCFA</span> sera débité via Airtel Money ou Moov Money pour finaliser votre dossier.
                  </p>

                  {paymentStatus === 'pending' ? (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center">
                      <p className="font-semibold text-blue-800">Demande envoyée</p>
                      <p className="mt-1 text-sm text-blue-700">{paymentStatusMessage || 'Validez la transaction sur votre téléphone.'}</p>
                      <div className="mt-4 flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentOperator('airtel')}
                          className={`rounded-xl border p-3 text-sm font-semibold transition ${
                            paymentOperator === 'airtel'
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          Airtel Money
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentOperator('moov')}
                          className={`rounded-xl border p-3 text-sm font-semibold transition ${
                            paymentOperator === 'moov'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          Moov Money
                        </button>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">Numéro de téléphone</span>
                        <input
                          value={paymentPhone}
                          onChange={(e) => setPaymentPhone(e.target.value)}
                          placeholder="074001209"
                          className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>

                      {paymentError && <p className="text-sm text-red-600">{paymentError}</p>}

                      <button
                        type="button"
                        onClick={submitWithPayment}
                        disabled={isPaymentLoading}
                        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPaymentLoading ? 'Initialisation du paiement…' : 'Payer et soumettre le dossier'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">Suivi</h3>
            <div className="relative space-y-4 border-l-2 border-slate-200 pl-6 text-sm">
              <div className="relative flex items-center py-1 text-blue-800">
                <span className="absolute -left-[2.625rem] flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-blue-600 font-bold text-white">1</span>
                <p className="font-semibold">Inscription enregistrée</p>
              </div>
              <div className="relative flex items-center py-1 text-amber-800">
                <span className="absolute -left-[2.625rem] flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-amber-500 font-bold text-white">2</span>
                <p className="font-semibold">Dossier en cours de complétion</p>
              </div>
              <div className="relative flex items-center py-1 text-slate-700">
                <span className="absolute -left-[2.625rem] flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-slate-200 font-bold text-slate-500">3</span>
                <p className="font-semibold">Validation du dossier</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsNotificationsModalOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-haspopup="dialog"
            >
              <span>
                <span className="block text-xs uppercase tracking-[0.12em] text-slate-500">Notifications</span>
                <span className="mt-2 block font-semibold text-slate-900">Consulter mes notifications</span>
              </span>
              <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white">
                {profile.notifications?.length || 0}
              </span>
            </button>

            {isNotificationsModalOpen && (
              <div
                className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="notifications-modal-title"
                onClick={() => setIsNotificationsModalOpen(false)}
              >
                <div
                  className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Espace candidat</p>
                      <h3 id="notifications-modal-title" className="mt-1 text-2xl font-bold text-slate-900">Notifications</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNotificationsModalOpen(false)}
                      aria-label="Fermer les notifications"
                      className="rounded-lg p-2 text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mt-6 space-y-3">
                    {(profile.notifications?.length ? profile.notifications : [{ id: 'default', message: 'Aucune notification pour le moment.', type: 'info', createdAt: new Date().toISOString() }]).slice(0, 5).map((notification) => (
                      <div key={notification.id} className={`rounded-xl border p-3 ${
                        notification.type === 'success'
                          ? 'border-green-200 bg-green-50 text-green-800'
                          : notification.type === 'danger'
                            ? 'border-red-200 bg-red-50 text-red-800'
                            : notification.type === 'warning'
                              ? 'border-amber-200 bg-amber-50 text-amber-800'
                              : 'border-blue-200 bg-blue-50 text-blue-800'
                      }`}>
                        <p className="text-sm">{translateNotification(notification.message, t)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {profile.dossierValide === true || profile.status === 'valide' ? (
              <button
                type="button"
                onClick={() => router.push('/vie-etudiante')}
                className="mt-6 w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                Accéder à ma convocation et mon espace concours
              </button>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}