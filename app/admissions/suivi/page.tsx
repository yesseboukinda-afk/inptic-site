'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  (documents ?? []).map(({ name, type }) => ({ name, type }));

const saveProfileSafely = (payload: CandidateProfile) => {
  const compacted = {
    ...payload,
    documents: compactDocuments(payload.documents),
  };

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

export default function Suivi() {
  const router = useRouter();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [form, setForm] = useState(defaultForm({}));
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');

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
        'Votre dossier a été soumis avec succès. Il est désormais en cours de validation par l’administration.',
        'info'
      ),
    };

    updateStoredProfile(nextProfile);
    setProfile(nextProfile);
    setMessage('Votre dossier a été transmis. Vous restez sur le suivi du dossier jusqu’à validation.');

    try {
      const response = await fetch('/api/candidat/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nextProfile,
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

  if (!ready || !profile) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100">
        <p className="text-slate-600">Chargement du suivi du dossier…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img src="/banniere/2.webp" alt="" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 md:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Admissions</p>
          <h1 className="text-4xl font-black md:text-6xl">Suivi du dossier</h1>
          <p className="mt-5 max-w-3xl text-lg text-blue-50">
            Votre inscription est bien enregistrée. Complétez votre dossier, téléversez les justificatifs, puis suivez son évolution jusqu’à validation.
          </p>
          <div className="mt-6 inline-flex rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-blue-50">
            Session 2026-2027 · Dépôt ouvert jusqu’au 18 septembre 2026
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Dossier de candidature</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Étapes de votre demande</h2>
            </div>
            <p className="text-sm text-slate-500">Étape {currentStepIndex + 1} sur 3</p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              { label: 'Compte candidat', detail: 'Informations personnelles', active: true },
              { label: 'Dépôt du dossier', detail: 'Formation et justificatifs', active: currentStepIndex >= 1 },
              { label: 'Traitement', detail: 'Validation par l’administration', active: currentStepIndex >= 2 },
            ].map((step, index) => (
              <div key={step.label} className={`flex items-center gap-3 rounded-2xl border p-4 ${step.active ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${step.active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{index + 1}</span>
                <div>
                  <p className={`font-semibold ${step.active ? 'text-blue-800' : 'text-slate-500'}`}>{step.label}</p>
                  <p className="text-xs text-slate-500">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-2xl font-bold text-slate-900">État de votre dossier</h2>
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

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  { label: 'Inscription', active: currentStepIndex >= 0 },
                  { label: 'Dossier', active: currentStepIndex >= 1 },
                  { label: 'Validation', active: currentStepIndex >= 2 },
                ].map((step, index) => (
                  <div
                    key={step.label}
                    className={`rounded-2xl border p-4 ${
                      step.active ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em]">Étape {index + 1}</p>
                    <p className="mt-2 font-semibold">{step.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Étudiant</p>
                  <p className="mt-2 font-semibold text-slate-900">{profile.name || 'Étudiant'}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Numéro de dossier</p>
                  <p className="mt-2 font-semibold text-slate-900">{profile.dossierNumero || form.dossierNumero}</p>
                </div>
              </div>
            </div>

            <form onSubmit={saveDossier} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-2xl font-bold text-slate-900">Compléter le dossier</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                  {profile.status === 'en_attente' ? 'Dossier soumis' : 'En cours'}
                </span>
              </div>

              <div className="mt-6 border-b border-slate-200 pb-5">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">1. Identité du candidat</p>
                <p className="mt-1 text-sm text-slate-500">Vérifiez les informations utilisées pour votre dossier.</p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Nom complet</span>
                  <input
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div className="md:col-span-2 border-t border-slate-200 pt-5">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">2. Parcours et formation demandée</p>
                  <p className="mt-1 text-sm text-slate-500">Indiquez votre niveau et la filière souhaitée à l’INPTIC.</p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Téléphone</span>
                  <input
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Niveau</span>
                  <input
                    value={form.niveau}
                    onChange={(e) => handleChange('niveau', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Parcours</span>
                  <input
                    value={form.parcours}
                    onChange={(e) => handleChange('parcours', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Filière</span>
                  <select
                    value={form.filiere}
                    onChange={(e) => handleChange('filiere', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Sélectionner une filière</option>
                    {filieres.map((filiere) => (
                      <option key={filiere} value={filiere}>{filiere}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Établissement</span>
                  <input
                    value={form.etablissement}
                    onChange={(e) => handleChange('etablissement', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Promotion</span>
                  <input
                    value={form.promotion}
                    onChange={(e) => handleChange('promotion', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Année</span>
                  <input
                    value={form.annee}
                    onChange={(e) => handleChange('annee', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Spécialité</span>
                  <input
                    value={form.specialite}
                    onChange={(e) => handleChange('specialite', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Diplôme / dernière qualification</span>
                  <input
                    value={form.diplome}
                    onChange={(e) => handleChange('diplome', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Biographie / motivation</span>
                  <textarea
                    value={form.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div className="md:col-span-2 border-t border-slate-200 pt-5">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">3. Pièces justificatives</p>
                  <p className="mt-1 text-sm text-slate-500">Ajoutez les documents nécessaires à l’étude de votre candidature.</p>
                </div>

                <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Justificatifs / documents</span>
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
                    <p className="mt-3 text-sm text-slate-500">Aucun document téléversé pour le moment.</p>
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

          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">Suivi</h3>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl bg-blue-50 p-4 text-blue-800">
                <p className="font-semibold">1. Inscription enregistrée</p>
                <p className="mt-1">Votre compte candidat a bien été créé.</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 text-amber-800">
                <p className="font-semibold">2. Dossier en cours de completion</p>
                <p className="mt-1">Téléversez vos justificatifs et choisissez votre filière.</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4 text-slate-700">
                <p className="font-semibold">3. Validation du dossier</p>
                <p className="mt-1">Une fois validé, votre profil étudiant s’ouvrira automatiquement.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Notifications</p>
              <div className="mt-3 space-y-3">
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
                    <p className="text-sm">{notification.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {profile.dossierValide === true || profile.status === 'valide' ? (
              <button
                type="button"
                onClick={() => router.push('/vie-etudiante')}
                className="mt-6 w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                Accéder à mon profil
              </button>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}
