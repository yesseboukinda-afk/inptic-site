'use client';

import { Settings, LogOut } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const emptyProfile = {
  name: '',
  email: '',
  phone: '',
  niveau: '',
  parcours: '',
  promotion: '',
  etablissement: '',
  annee: '',
  specialite: '',
  bio: '',
  diplome: '',
  photo: '',
  documents: [] as Array<{ name: string; type: string; data: string }>,
};

const defaultAvatar =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1d4ed8"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="32" fill="url(#bg)"/>
      <circle cx="100" cy="72" r="34" fill="#f8fafc" fill-opacity="0.92"/>
      <path d="M52 158c12-28 35-42 48-42s36 14 48 42" fill="#f8fafc" fill-opacity="0.92"/>
      <path d="M34 80L100 42L166 80L100 118L34 80Z" fill="#facc15" fill-opacity="0.9"/>
      <text x="100" y="130" text-anchor="middle" font-size="18" font-weight="700" fill="#0f172a" font-family="Arial, sans-serif">INPTIC</text>
    </svg>
  `);

export default function VieEtudiante() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [profile, setProfile] = useState(emptyProfile);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('inptic_user');
    if (!stored) {
      router.replace('/candidat');
      return;
    }

    const parsed = JSON.parse(stored);
    if (parsed?.dossierValide !== true && parsed?.status !== 'valide') {
      router.replace('/admissions/suivi');
      return;
    }

    setProfile({
      name: parsed.name || '',
      email: parsed.email || '',
      phone: parsed.phone || '',
      niveau: parsed.niveau || '',
      parcours: parsed.parcours || '',
      promotion: parsed.promotion || '',
      etablissement: parsed.etablissement || '',
      annee: parsed.annee || '',
      specialite: parsed.specialite || '',
      bio: parsed.bio || '',
      diplome: parsed.diplome || '',
      photo: parsed.photo || '',
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
    });
    setIsReady(true);
  }, [router]);

  function handleChange(field: keyof typeof emptyProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setProfile((current) => ({ ...current, photo: result }));
    };
    reader.readAsDataURL(file);
  }

  function handleDocumentsChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    Promise.all(
      files.map(
        (file) =>
          new Promise<{ name: string; type: string; data: string }>((resolve, reject) => {
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
      .then((uploadedDocuments) => {
        setProfile((current) => ({
          ...current,
          documents: [...current.documents, ...uploadedDocuments],
        }));
      })
      .catch(() => {
        setSaved('Le téléchargement de certains documents a échoué.');
      });

    event.target.value = '';
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();

    const user = {
      ...profile,
      name: profile.name || 'Étudiant',
      email: profile.email || 'non renseigné',
      documents: profile.documents || [],
    };

    try {
      const response = await fetch('/api/candidat/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Erreur de sauvegarde');
      }

      const storedProfiles = JSON.parse(localStorage.getItem('inptic_users') || '[]');
      const nextProfiles = storedProfiles.some((entry: { email?: string }) => entry.email === user.email)
        ? storedProfiles.map((entry: { email?: string }) => (entry.email === user.email ? { ...entry, ...user, role: 'etudiant' } : entry))
        : [...storedProfiles, { ...user, role: 'etudiant' }];
      localStorage.setItem('inptic_users', JSON.stringify(nextProfiles));
      localStorage.setItem('inptic_user', JSON.stringify(user));
      setSaved(data?.source === 'supabase' ? 'Profil enregistré dans Supabase avec succès.' : 'Profil mis à jour avec succès.');
      setSettingsOpen(false);
    } catch (error) {
      const storedProfiles = JSON.parse(localStorage.getItem('inptic_users') || '[]');
      const nextProfiles = storedProfiles.some((entry: { email?: string }) => entry.email === user.email)
        ? storedProfiles.map((entry: { email?: string }) => (entry.email === user.email ? { ...entry, ...user, role: 'etudiant' } : entry))
        : [...storedProfiles, { ...user, role: 'etudiant' }];
      localStorage.setItem('inptic_users', JSON.stringify(nextProfiles));
      localStorage.setItem('inptic_user', JSON.stringify(user));
      setSaved(error instanceof Error ? error.message : 'Profil mis à jour localement.');
      setSettingsOpen(false);
    }
  }

  function logout() {
    localStorage.removeItem('inptic_user');
    router.replace('/candidat');
  }

  if (!isReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100">
        <p className="text-slate-600">Vérification de l’accès…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden text-white">
        <img src="/banniere/2.webp" alt="" className="hero-image-reveal absolute inset-y-0 right-0 z-0 h-full w-3/5 scale-105 object-cover object-center brightness-105 saturate-105" aria-hidden="true" />
        <div className="absolute inset-0 z-[1]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(7, 25, 55, 0.98) 0%, rgba(7, 25, 55, 0.88) 30%, rgba(7, 25, 55, 0.5) 50%, rgba(0, 142, 174, 0.16) 75%, rgba(0, 142, 174, 0.04) 100%)' }} aria-hidden="true" />
        <div className="container-x px-3 py-10 md:px-0 md:py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100 md:text-sm">Mon compte</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">Bienvenue, {profile.name || 'Étudiant'}</h1>
              <p className="mt-2 text-sm text-blue-50 md:mt-3">Votre espace personnel INPTIC.</p>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button
                type="button"
                aria-label="Paramètres du compte"
                title="Paramètres du compte"
                onClick={() => setSettingsOpen(true)}
                className="inline-flex items-center justify-center rounded-xl bg-white p-2.5 text-blue-700 shadow-sm transition hover:bg-blue-50"
              >
                <Settings size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Déconnexion"
                onClick={logout}
                className="mobile-icon-action rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <LogOut size={18} aria-hidden="true" />
                <span className="btn-label">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x px-3 py-6 md:px-0 md:py-10">
        <div className="grid gap-4 md:gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:rounded-3xl md:p-6">
            <div className="flex flex-col items-center gap-3 text-center md:gap-4">
              <label
                className="group relative block h-24 w-24 cursor-pointer overflow-hidden rounded-full border-4 border-white shadow-md ring-2 ring-slate-200 transition hover:scale-[1.01] md:h-28 md:w-28"
                aria-label="Changer la photo de profil"
                title="Cliquez pour télécharger une nouvelle photo"
              >
                <img
                  src={profile.photo || defaultAvatar}
                  alt="Photo de profil"
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-slate-950/50 text-[10px] font-semibold uppercase tracking-[0.12em] text-white opacity-0 transition group-hover:opacity-100">
                  Photo
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>

              <div>
                <p className="text-lg font-bold text-slate-900 md:text-xl">{profile.name || 'Étudiant'}</p>
                <p className="text-xs text-slate-500 md:text-sm">{profile.email || 'Email non renseigné'}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-600 md:mt-6 md:space-y-4">
              <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-xs">Niveau</p>
                <p className="mt-2 font-semibold text-slate-900">{profile.niveau || 'À renseigner'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-xs">Parcours</p>
                <p className="mt-2 font-semibold text-slate-900">{profile.parcours || 'À renseigner'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-xs">Promotion</p>
                <p className="mt-2 font-semibold text-slate-900">{profile.promotion || 'À renseigner'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-xs">Établissement</p>
                <p className="mt-2 font-semibold text-slate-900">{profile.etablissement || 'À renseigner'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-xs">Spécialité</p>
                <p className="mt-2 font-semibold text-slate-900">{profile.specialite || 'À renseigner'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-xs">Année</p>
                <p className="mt-2 font-semibold text-slate-900">{profile.annee || 'À renseigner'}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:mt-6 md:p-4">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-xs">Documents</p>
              {profile.documents.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {profile.documents.map((document) => (
                    <li key={`${document.name}-${document.type}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
                      <span className="truncate">{document.name}</span>
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">
                        {document.type.includes('pdf') ? 'PDF' : 'Fichier'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Aucun document téléchargé.</p>
              )}
            </div>
          </aside>

          <div className="space-y-4 md:space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:rounded-3xl md:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Mes informations</h2>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700 md:px-3 md:text-xs">
                  Ancien étudiant
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:mt-6 md:grid-cols-2 md:gap-4">
                <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-xs">Téléphone</p>
                  <p className="mt-2 font-semibold text-slate-900">{profile.phone || 'À renseigner'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-xs">Email</p>
                  <p className="mt-2 break-all font-semibold text-slate-900">{profile.email || 'À renseigner'}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:mt-6 md:p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-xs">Biographie</p>
                <p className="mt-2 leading-6 text-slate-700 md:leading-7">
                  {profile.bio || 'Aucune information ajoutée pour le moment.'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:rounded-3xl md:p-6">
                <h3 className="text-lg font-bold text-slate-900 md:text-xl">Parcours académique</h3>
                <p className="mt-3 leading-6 text-slate-700 md:mt-4 md:leading-7">
                  {profile.parcours || 'Le parcours académique n’a pas encore été renseigné.'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:rounded-3xl md:p-6">
                <h3 className="text-lg font-bold text-slate-900 md:text-xl">Diplômes obtenus</h3>
                <p className="mt-3 leading-6 text-slate-700 md:mt-4 md:leading-7">
                  {profile.diplome || 'Aucun diplôme n’a encore été ajouté.'}
                </p>
              </div>
            </div>

            {saved && <p className="text-sm text-green-600">{saved}</p>}
          </div>
        </div>
      </section>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 md:items-center md:p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl md:rounded-3xl md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Paramètres du compte</h2>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={saveProfile} className="mt-5 grid gap-3 md:mt-6 md:grid-cols-2 md:gap-4">
              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-slate-700">Nom complet</span>
                <input
                  value={profile.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-slate-700">Téléphone</span>
                <input
                  value={profile.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-slate-700">Niveau</span>
                <input
                  value={profile.niveau}
                  onChange={(e) => handleChange('niveau', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-slate-700">Parcours</span>
                <input
                  value={profile.parcours}
                  onChange={(e) => handleChange('parcours', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-slate-700">Promotion</span>
                <input
                  value={profile.promotion}
                  onChange={(e) => handleChange('promotion', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-slate-700">Établissement</span>
                <input
                  value={profile.etablissement}
                  onChange={(e) => handleChange('etablissement', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-slate-700">Spécialité</span>
                <input
                  value={profile.specialite}
                  onChange={(e) => handleChange('specialite', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-slate-700">Année</span>
                <input
                  value={profile.annee}
                  onChange={(e) => handleChange('annee', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Diplôme obtenu</span>
                <input
                  value={profile.diplome}
                  onChange={(e) => handleChange('diplome', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Photo de profil</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Documents du profil</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={handleDocumentsChange}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Biographie</span>
                <textarea
                  rows={4}
                  value={profile.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="md:col-span-2 flex flex-col-reverse gap-3 pt-2 md:flex-row md:items-center md:justify-end">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="mobile-icon-action rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                  aria-label="Sauvegarder"
                  title="Sauvegarder"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <path d="M17 21v-8H7v8" />
                    <path d="M7 3v5h8" />
                  </svg>
                  <span className="btn-label">Sauvegarder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
