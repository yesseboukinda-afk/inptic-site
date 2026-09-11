'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { translateAuthError } from '@/lib/authMessages';
import { getRolePath, getStaffRole, isDirectorRole, normalizeRole } from '@/lib/roles';

const generateDossierNumber = () => `INPTIC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

const addNotification = (
  notifications: Array<{ id: string; message: string; type: string; createdAt: string }> | undefined,
  message: string,
  type: string = 'info'
) => {
  const nextNotifications = Array.isArray(notifications) ? notifications : [];
  return [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      type,
      createdAt: new Date().toISOString(),
    },
    ...nextNotifications,
  ];
};

const readLocalProfiles = () => {
  try {
    const raw = localStorage.getItem('inptic_users');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistLocalProfile = (profile: Record<string, any>) => {
  const existingProfiles: any[] = readLocalProfiles();
  const nextProfiles = existingProfiles.some((entry: any) => entry.email?.toLowerCase() === profile.email?.toLowerCase())
    ? existingProfiles.map((entry: any) =>
        entry.email?.toLowerCase() === profile.email?.toLowerCase() ? { ...entry, ...profile, role: profile.role || entry.role || 'etudiant' } : entry
      )
    : [...existingProfiles, { ...profile, role: profile.role || 'etudiant' }];

  localStorage.setItem('inptic_users', JSON.stringify(nextProfiles));
  localStorage.setItem('inptic_user', JSON.stringify(profile));
  window.dispatchEvent(new Event('auth-state-changed'));
};

export default function Candidat() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [isLoginPasswordVisible, setIsLoginPasswordVisible] = useState(false);
  const [isSignupPasswordVisible, setIsSignupPasswordVisible] = useState(false);

  useEffect(() => {
    if (!msg) return;

    const timeout = window.setTimeout(() => setMsg(''), 2000);
    return () => window.clearTimeout(timeout);
  }, [msg]);

  useEffect(() => {
    const storedRaw = localStorage.getItem('inptic_user');
    const director = localStorage.getItem('inptic_directeur');

    if (director) {
      router.replace('/directeur');
      return;
    }

    if (storedRaw) {
      try {
        const stored = JSON.parse(storedRaw);
        const storedRole = normalizeRole(stored?.role);
        if (isDirectorRole(storedRole) || stored?.email?.toLowerCase() === 'directeur@inptic.ga') {
          router.replace('/directeur');
        } else if (getStaffRole(storedRole)) {
          router.replace(getRolePath(getStaffRole(storedRole)));
        } else if (stored?.dossierValide === true || stored?.status === 'valide') {
          router.replace('/vie-etudiante');
        } else {
          router.replace('/admissions/suivi');
        }
      } catch {
        localStorage.removeItem('inptic_user');
      }
    }
  }, [router]);

  async function login(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase) {
      const localProfiles = readLocalProfiles();
      const normalizedEmail = form.email.trim().toLowerCase();
      const matchingProfile = localProfiles.find(
        (entry: any) => entry.email?.toLowerCase() === normalizedEmail && entry.password === form.password
      );

      if (!matchingProfile) {
        setMsg('Connexion Supabase non configurée. Ajoutez les variables d’environnement en production, puis redéployez.');
        return;
      }

      const profile = {
        ...matchingProfile,
        password: form.password,
        role: matchingProfile.role || 'etudiant',
      };

      const localRole = normalizeRole(profile.role);
      if (isDirectorRole(localRole) || profile.email?.toLowerCase() === 'directeur@inptic.ga') {
        localStorage.removeItem('inptic_user');
        localStorage.setItem(
          'inptic_directeur',
          JSON.stringify({ email: profile.email, name: profile.name || 'Directeur général', role: 'directeur' })
        );
        window.dispatchEvent(new Event('auth-state-changed'));
        setMsg('Connexion réussie.');
        router.push('/directeur');
        return;
      }

      localStorage.removeItem('inptic_directeur');
      localStorage.setItem('inptic_user', JSON.stringify(profile));
      window.dispatchEvent(new Event('auth-state-changed'));
      setMsg('Connexion réussie.');
      const localStaffRole = getStaffRole(localRole);
      if (localStaffRole) {
        localStorage.removeItem('inptic_user');
        localStorage.setItem('inptic_staff', JSON.stringify({ email: profile.email, name: profile.name, role: localStaffRole }));
        window.dispatchEvent(new Event('auth-state-changed'));
        router.push(getRolePath(localStaffRole));
        return;
      }
      router.push(profile.dossierValide ? '/vie-etudiante' : '/admissions/suivi');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        throw error;
      }

      const user = data.user;
      const rawRole =
        user?.user_metadata?.role ??
        user?.user_metadata?.roles ??
        user?.app_metadata?.role ??
        user?.app_metadata?.roles ??
        '';
      const normalizedRole = normalizeRole(rawRole);
      const staffRole = user?.email?.toLowerCase() === 'dep@inptic.ga'
        ? 'direction_etudes'
        : getStaffRole(normalizedRole);
      const isDirector =
        isDirectorRole(normalizedRole) ||
        user?.email?.toLowerCase() === 'directeur@inptic.ga';
      const profile = {
        email: user?.email || form.email,
        name: user?.user_metadata?.full_name || user?.user_metadata?.name || form.name || 'Étudiant',
        phone: user?.user_metadata?.phone || '',
        niveau: user?.user_metadata?.niveau || '',
        parcours: user?.user_metadata?.parcours || '',
        promotion: user?.user_metadata?.promotion || '',
        etablissement: user?.user_metadata?.etablissement || '',
        annee: user?.user_metadata?.annee || '',
        specialite: user?.user_metadata?.specialite || '',
        bio: user?.user_metadata?.bio || '',
        diplome: user?.user_metadata?.diplome || '',
        photo: user?.user_metadata?.photo || '',
        documents: Array.isArray(user?.user_metadata?.documents) ? user.user_metadata.documents : [],
        dossierValide: Boolean(user?.user_metadata?.dossierValide || user?.user_metadata?.status === 'valide'),
        status: user?.user_metadata?.status || 'en_attente',
        dossierStep: user?.user_metadata?.dossierStep || (user?.user_metadata?.status === 'valide' ? 'valide' : 'inscription'),
        dossierNumero: user?.user_metadata?.dossierNumero || generateDossierNumber(),
        filiere: user?.user_metadata?.filiere || '',
        notifications: Array.isArray(user?.user_metadata?.notifications) ? user.user_metadata.notifications : [],
        role: staffRole || (isDirector ? 'directeur' : 'etudiant'),
      };

      if (isDirector) {
        localStorage.removeItem('inptic_user');
        localStorage.setItem(
          'inptic_directeur',
          JSON.stringify({ email: profile.email, name: profile.name || 'Directeur général', role: 'directeur' })
        );
        window.dispatchEvent(new Event('auth-state-changed'));
        router.push('/directeur');
        return;
      }

      if (staffRole) {
        localStorage.removeItem('inptic_user');
        localStorage.setItem('inptic_staff', JSON.stringify({ email: profile.email, name: profile.name, role: staffRole }));
        window.dispatchEvent(new Event('auth-state-changed'));
        router.push(getRolePath(staffRole));
        return;
      }

      localStorage.removeItem('inptic_directeur');
      const existingProfiles = JSON.parse(localStorage.getItem('inptic_users') || '[]');
      const nextProfiles = existingProfiles.some((entry: { email?: string }) => entry.email === profile.email)
        ? existingProfiles
        : [...existingProfiles, { ...profile, role: 'etudiant' }];
      localStorage.setItem('inptic_users', JSON.stringify(nextProfiles));
      localStorage.setItem('inptic_user', JSON.stringify(profile));
      window.dispatchEvent(new Event('auth-state-changed'));

      try {
        await fetch('/api/candidat/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        });
      } catch {
        // Fallback local-only if Supabase is not configured.
      }

      setMsg('Connexion réussie.');
      router.push(profile.dossierValide ? '/vie-etudiante' : '/admissions/suivi');
    } catch (error) {
      const localProfiles = readLocalProfiles();
      const normalizedEmail = form.email.trim().toLowerCase();
      const matchingProfile = localProfiles.find(
        (entry: any) => entry.email?.toLowerCase() === normalizedEmail && entry.password === form.password
      );

      if (matchingProfile) {
        const profile = { ...matchingProfile, password: form.password };
        const localRole = normalizeRole(profile.role);
        const localStaffRole = profile.email?.toLowerCase() === 'dep@inptic.ga' ? 'direction_etudes' : getStaffRole(localRole);
        if (isDirectorRole(localRole) || profile.email?.toLowerCase() === 'directeur@inptic.ga') {
          localStorage.setItem('inptic_directeur', JSON.stringify({ email: profile.email, name: profile.name || 'Directeur général', role: 'directeur' }));
          router.push('/directeur');
          return;
        }
        if (localStaffRole) {
          localStorage.setItem('inptic_staff', JSON.stringify({ email: profile.email, name: profile.name, role: localStaffRole }));
          router.push(getRolePath(localStaffRole));
          return;
        }
        localStorage.removeItem('inptic_directeur');
        localStorage.setItem('inptic_user', JSON.stringify(profile));
        window.dispatchEvent(new Event('auth-state-changed'));
        setMsg('Connexion réussie.');
        router.push(profile.dossierValide ? '/vie-etudiante' : '/admissions/suivi');
        return;
      }

      const message = error instanceof Error ? translateAuthError(error.message) : 'Une erreur est survenue lors de la connexion.';
      setMsg(message);
    }
  }

  async function requestPasswordReset(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase) {
      setMsg('La récupération du mot de passe nécessite la configuration Supabase.');
      return;
    }

    const email = form.email.trim();

    if (!email) {
      setMsg('Saisissez votre adresse email pour recevoir le lien de récupération.');
      return;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    setMsg(
      error
        ? translateAuthError(error.message)
        : 'Un lien de récupération a été envoyé à cette adresse email.'
    );
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      setMsg('Veuillez remplir tous les champs pour vous inscrire au concours.');
      return;
    }

    if (!supabase) {
      const profile = {
        email: form.email.trim(),
        name: form.name.trim(),
        password: form.password,
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
        documents: [],
        dossierValide: false,
        status: 'inscription',
        dossierStep: 'inscription',
        dossierNumero: generateDossierNumber(),
        filiere: '',
        notifications: addNotification([], 'Votre inscription au concours a bien été enregistrée. Complétez maintenant votre dossier pour finaliser votre candidature.', 'info'),
        role: 'etudiant',
      };

      const existingProfiles = readLocalProfiles();
      const alreadyExists = existingProfiles.some(
        (entry: { email?: string }) => entry.email?.toLowerCase() === profile.email.toLowerCase()
      );

      if (alreadyExists) {
        setMsg('Un compte existe déjà avec cet email. Connectez-vous pour continuer.');
        setMode('login');
        return;
      }

      persistLocalProfile(profile);
      setMsg('Compte créé avec succès. Vous pouvez maintenant compléter votre dossier.');
      router.push('/admissions/suivi');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            role: 'etudiant',
            dossierValide: false,
            status: 'en_attente',
          },
        },
      });

      if (error) {
        throw error;
      }

      const profile = {
        email: data.user?.email || form.email,
        name: form.name,
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
        documents: [],
        dossierValide: false,
        status: 'inscription',
        dossierStep: 'inscription',
        dossierNumero: generateDossierNumber(),
        filiere: '',
        notifications: addNotification([], 'Votre inscription au concours a bien été enregistrée. Complétez maintenant votre dossier pour finaliser votre candidature.', 'info'),
        role: 'etudiant',
      };

      const existingProfiles = JSON.parse(localStorage.getItem('inptic_users') || '[]');
      const nextProfiles = existingProfiles.some((entry: { email?: string }) => entry.email === profile.email)
        ? existingProfiles.map((entry: { email?: string }) => (entry.email === profile.email ? { ...entry, ...profile, role: 'etudiant' } : entry))
        : [...existingProfiles, { ...profile, role: 'etudiant' }];
      localStorage.setItem('inptic_users', JSON.stringify(nextProfiles));
      localStorage.setItem('inptic_user', JSON.stringify(profile));
      window.dispatchEvent(new Event('auth-state-changed'));

      try {
        await fetch('/api/candidat/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        });
      } catch {
        // Fallback local-only if Supabase is not configured.
      }

      setMsg(
        data.session
          ? 'Inscription enregistrée. Votre dossier est en cours de traitement.'
          : 'Compte créé. Vérifiez votre e-mail pour confirmer votre inscription, puis connectez-vous.'
      );

      if (data.session) {
        router.push('/admissions/suivi');
      }
    } catch (error) {
      const profile = {
        email: form.email.trim(),
        name: form.name.trim(),
        password: form.password,
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
        documents: [],
        dossierValide: false,
        status: 'inscription',
        dossierStep: 'inscription',
        dossierNumero: generateDossierNumber(),
        filiere: '',
        notifications: addNotification([], 'Votre inscription au concours a bien été enregistrée. Complétez maintenant votre dossier pour finaliser votre candidature.', 'info'),
        role: 'etudiant',
      };

      const existingProfiles = readLocalProfiles();
      const alreadyExists = existingProfiles.some(
        (entry: { email?: string }) => entry.email?.toLowerCase() === profile.email.toLowerCase()
      );

      if (!alreadyExists) {
        persistLocalProfile(profile);
      }

      setMsg('Inscription enregistrée localement. Vous pouvez maintenant compléter votre dossier.');
      router.push('/admissions/suivi');
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto max-w-5xl grid gap-8 rounded-3xl bg-white p-6 shadow-xl md:grid-cols-[1.1fr_1fr] md:p-10">
        <section className="rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-600 p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">Connexion</p>
          <h1 className="mt-3 text-4xl font-black">Compte</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-blue-50">
            Connectez-vous pour accéder à votre espace. Si vous souhaitez intégrer l’INPTIC, vous pouvez aussi vous inscrire au concours et être orienté vers votre espace étudiant.
          </p>

          <div className="mt-8 flex justify-center gap-3 md:flex-col md:items-stretch">
            <button
              type="button"
              onClick={() => setMode('login')}
              aria-label="Je me connecte"
              className={`mobile-icon-action rounded-xl px-4 py-3 font-semibold transition ${
                mode === 'login' ? 'bg-white text-blue-700' : 'bg-blue-500/20 text-white border border-blue-300/30'
              }`}
            >
              <LogIn size={18} aria-hidden="true" />
              <span className="btn-label">Je me connecte</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              aria-label="Inscription au concours"
              className={`mobile-icon-action rounded-xl px-4 py-3 font-semibold transition ${
                mode === 'signup' ? 'bg-white text-blue-700' : 'bg-blue-500/20 text-white border border-blue-300/30'
              }`}
            >
              <UserPlus size={18} aria-hidden="true" />
              <span className="btn-label">Inscription au concours</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('forgot')}
              aria-label="Mot de passe oublié"
              className={`mobile-icon-action rounded-xl px-4 py-3 font-semibold transition ${
                mode === 'forgot' ? 'bg-white text-blue-700' : 'bg-blue-500/20 text-white border border-blue-300/30'
              }`}
            >
              <KeyRound size={18} aria-hidden="true" />
              <span className="btn-label">Mot de passe oublié</span>
            </button>
          </div>

          <div className="mt-8 rounded-2xl border border-white/15 bg-slate-950/15 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Session d'inscription</p>
            <p className="mt-2 text-lg font-bold">2026-2027</p>
            <p className="mt-1 text-sm text-blue-50">Ouverte du 03 août au 18 septembre 2026</p>
          </div>

          <ol className="mt-6 space-y-3 text-sm text-blue-50">
            <li className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white font-bold text-blue-700">1</span>Créer votre compte candidat</li>
            <li className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 font-bold text-white">2</span>Compléter le dossier et les pièces</li>
            <li className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 font-bold text-white">3</span>Suivre la validation en ligne</li>
          </ol>
        </section>

        <section className="flex items-center">
          {mode === 'login' ? (
            <form onSubmit={login} className="w-full">
              <h2 className="text-2xl font-bold text-slate-900">Connexion</h2>
              <p className="mt-2 text-sm text-slate-500">Accédez à votre compte candidat.</p>

              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                className="mt-6 w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <div className="relative mt-3">
                <input
                  required
                  type={isLoginPasswordVisible ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mot de passe"
                  className="w-full rounded-xl border border-slate-200 p-3 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setIsLoginPasswordVisible((visible) => !visible)}
                  aria-label={isLoginPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  title={isLoginPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 transition hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isLoginPasswordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>

              <button
                type="submit"
                aria-label="Connexion"
                className="mobile-icon-action mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <LogIn size={18} aria-hidden="true" />
                <span className="btn-label">Connexion</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                Mot de passe oublié ?
              </button>
            </form>
          ) : mode === 'forgot' ? (
            <form onSubmit={requestPasswordReset} className="w-full">
              <h2 className="text-2xl font-bold text-slate-900">Récupérer le mot de passe</h2>
              <p className="mt-2 text-sm text-slate-500">Recevez un lien sécurisé pour définir un nouveau mot de passe.</p>

              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                className="mt-6 w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="submit"
                aria-label="Envoyer le lien de récupération"
                className="mobile-icon-action mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <KeyRound size={18} aria-hidden="true" />
                <span className="btn-label">Envoyer le lien</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                Retour à la connexion
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="w-full">
              <h2 className="text-2xl font-bold text-slate-900">Inscription au concours</h2>
              <p className="mt-2 text-sm text-slate-500">Créez votre compte pour candidater à l’INPTIC.</p>

              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nom complet"
                className="mt-6 w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                className="mt-3 w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <div className="relative mt-3">
                <input
                  required
                  type={isSignupPasswordVisible ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Créer un mot de passe"
                  className="w-full rounded-xl border border-slate-200 p-3 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setIsSignupPasswordVisible((visible) => !visible)}
                  aria-label={isSignupPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  title={isSignupPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 transition hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isSignupPasswordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>

              <button
                type="submit"
                aria-label="Inscription au concours"
                className="mobile-icon-action mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <UserPlus size={18} aria-hidden="true" />
                <span className="btn-label">Inscription au concours</span>
              </button>
            </form>
          )}

          {msg && (
            <div
              role="status"
              aria-live="polite"
              className={`auth-toast ${/incorrect|introuv|invalid|password|mot de passe|erreur|invalide|expir|nécessite|échou|requis|correspond|remplir|existe déjà/i.test(msg) ? 'auth-toast-error' : 'auth-toast-success'}`}
            >
              {msg}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

