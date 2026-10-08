'use client';

import { Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { isSuperAdminRole } from '@/lib/roles';

type DirectorProfile = {
  name: string;
  email: string;
  phone?: string;
  poste?: string;
  departement?: string;
  bureau?: string;
  photo?: string;
  bio?: string;
};

const defaultAvatar =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#2563eb"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="32" fill="url(#bg)"/>
      <circle cx="100" cy="72" r="34" fill="#f8fafc"/>
      <path d="M52 158c12-28 35-42 48-42s36 14 48 42" fill="#f8fafc"/>
      <text x="100" y="136" text-anchor="middle" font-size="14" font-weight="700" fill="#0f172a" font-family="Arial, sans-serif">DG</text>
    </svg>
  `);

export default function DirecteurCompte() {
  const { t } = useTranslation();
  const router = useRouter();
  const [profile, setProfile] = useState<DirectorProfile>({
    name: 'Directeur général',
    email: 'directeur@inptic.ga',
    phone: '+241 00 00 00 00',
    poste: 'Directeur général',
    departement: 'Direction générale',
    bureau: 'Siège INPTIC',
    photo: defaultAvatar,
    bio: 'Le directeur général supervise l’orientation stratégique, la qualité des programmes et l’accompagnement des étudiants et partenaires institutionnels.',
  });
  const [form, setForm] = useState<DirectorProfile>({
    name: 'Directeur général',
    email: 'directeur@inptic.ga',
    phone: '+241 00 00 00 00',
    poste: 'Directeur général',
    departement: 'Direction générale',
    bureau: 'Siège INPTIC',
    photo: defaultAvatar,
    bio: 'Le directeur général supervise l’orientation stratégique, la qualité des programmes et l’accompagnement des étudiants et partenaires institutionnels.',
  });
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const director = localStorage.getItem('inptic_directeur');
    if (!director) {
      router.replace('/candidat');
      return;
    }

    try {
      const parsed = JSON.parse(director);
      if (!isSuperAdminRole(parsed.role)) {
        router.replace('/candidat');
        return;
      }
      const nextProfile = {
        name: parsed.name || 'Directeur général',
        email: parsed.email || 'directeur@inptic.ga',
        phone: parsed.phone || '+241 00 00 00 00',
        poste: parsed.poste || 'Directeur général',
        departement: parsed.departement || 'Direction générale',
        bureau: parsed.bureau || 'Siège INPTIC',
        photo: parsed.photo || defaultAvatar,
        bio: parsed.bio || 'Le directeur général supervise l’orientation stratégique, la qualité des programmes et l’accompagnement des étudiants et partenaires institutionnels.',
      };
      setProfile(nextProfile);
      setForm(nextProfile);
    } catch {
      router.replace('/candidat');
      return;
    }

    setReady(true);
  }, [router]);

  function handleFieldChange(field: keyof DirectorProfile, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setForm((current) => ({ ...current, photo: result }));
    };
    reader.readAsDataURL(file);
  }

  function saveProfile() {
    const nextProfile: DirectorProfile = {
      ...form,
      name: form.name || 'Directeur général',
      email: form.email || 'directeur@inptic.ga',
      phone: form.phone || '+241 00 00 00 00',
      poste: form.poste || 'Directeur général',
      departement: form.departement || 'Direction générale',
      bureau: form.bureau || 'Siège INPTIC',
      photo: form.photo || defaultAvatar,
      bio: form.bio || 'Le directeur général supervise l’orientation stratégique, la qualité des programmes et l’accompagnement des étudiants et partenaires institutionnels.',
    };

    localStorage.setItem('inptic_directeur', JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setForm(nextProfile);
    setSettingsOpen(false);
  }

  function logout() {
    localStorage.removeItem('inptic_directeur');
    router.replace('/candidat');
  }

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100">
        <p className="text-slate-600">{t('pages.loading')}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 md:p-8">
      <div className="mx-auto max-w-6xl space-y-4 md:space-y-6">
        <header className="rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-600 p-4 text-white md:rounded-3xl md:p-6">
          <div className="flex items-start justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-100 md:text-xs">{t('pages.account')}</p>
              <h1 className="mt-2 text-2xl font-black md:text-3xl">Bienvenue, {profile.name}</h1>
            </div>

            <button
              type="button"
              aria-label="Paramètres du compte"
              title="Paramètres du compte"
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-white p-2.5 text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              <Settings size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:rounded-3xl md:p-6">
            <div className="flex flex-col items-center text-center">
              <img
                src={profile.photo || defaultAvatar}
                alt="Photo du directeur"
                className="h-24 w-24 rounded-full object-cover ring-4 ring-blue-100 md:h-32 md:w-32"
              />
              <h2 className="mt-4 text-xl font-black text-slate-900 md:text-2xl">{profile.name}</h2>
              <p className="text-xs text-slate-500 md:text-sm">{profile.email}</p>
            </div>

            <div className="mt-5 space-y-3 md:mt-6 md:space-y-4">
              <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-xs">Poste</p>
                <p className="mt-2 font-semibold text-slate-900">{profile.poste || 'Non renseigné'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-xs">Département</p>
                <p className="mt-2 font-semibold text-slate-900">{profile.departement || 'Non renseigné'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-xs">Bureau</p>
                <p className="mt-2 font-semibold text-slate-900">{profile.bureau || 'Non renseigné'}</p>
              </div>
            </div>
          </aside>

          <div className="space-y-4 md:space-y-6">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:rounded-3xl md:p-6">
              <h2 className="text-xl font-black text-slate-900 md:text-2xl">Informations personnelles</h2>
              <div className="mt-4 grid gap-3 md:mt-6 md:grid-cols-2 md:gap-4">
                <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-xs">Téléphone</p>
                  <p className="mt-2 font-semibold text-slate-900">{profile.phone || 'Non renseigné'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 md:p-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 md:text-xs">Email professionnel</p>
                  <p className="mt-2 break-all font-semibold text-slate-900">{profile.email}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:rounded-3xl md:p-6">
              <h3 className="text-lg font-black text-slate-900 md:text-xl">Présentation</h3>
              <p className="mt-3 leading-6 text-slate-700 md:mt-4 md:leading-7">{profile.bio}</p>
            </div>
          </div>
        </section>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 md:items-center md:p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl md:rounded-3xl md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-slate-900 md:text-2xl">Paramètres du compte</h2>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:mt-6 md:grid-cols-2 md:gap-4">
              <div className="md:col-span-2 flex justify-center">
                <label className="group flex cursor-pointer items-center justify-center rounded-2xl bg-slate-50 p-3 transition hover:bg-slate-100 md:p-4" title="Cliquez pour changer la photo" aria-label="Changer la photo de profil">
                  <img
                    src={form.photo || defaultAvatar}
                    alt="Photo de profil du directeur"
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-100 md:h-20 md:w-20"
                  />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
              </div>

              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-slate-700">Nom</span>
                <input
                  value={form.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-slate-700">Téléphone</span>
                <input
                  value={form.phone || ''}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-slate-700">Poste</span>
                <input
                  value={form.poste || ''}
                  onChange={(e) => handleFieldChange('poste', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-slate-700">Département</span>
                <input
                  value={form.departement || ''}
                  onChange={(e) => handleFieldChange('departement', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-1">
                <span className="mb-2 block text-sm font-medium text-slate-700">Bureau</span>
                <input
                  value={form.bureau || ''}
                  onChange={(e) => handleFieldChange('bureau', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Présentation</span>
                <textarea
                  value={form.bio || ''}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-center md:mt-6 md:justify-end">
              <button
                type="button"
                onClick={saveProfile}
                className="mobile-icon-action w-full max-w-[220px] rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 md:w-auto md:max-w-none"
                aria-label="Enregistrer"
                title="Enregistrer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <path d="M17 21v-8H7v8" />
                  <path d="M7 3v5h8" />
                </svg>
                <span className="btn-label">Enregistrer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
