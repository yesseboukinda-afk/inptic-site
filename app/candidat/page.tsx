'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { translateAuthError } from '@/lib/authMessages';
import { getRolePath, getStaffRole, isDirectorRole, normalizeRole } from '@/lib/roles';
import { useTranslation } from 'react-i18next';

const generateDossierNumber = () => `INPTIC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

const normalizeAccountEmail = (value?: string) => (value ?? '').trim().toLowerCase().replace(/,/g, '.');
const isSpecialStaffEmail = (email?: string) => {
  const normalized = normalizeAccountEmail(email);
  return normalized === 'dep@inptic.ga' || normalized === 'dep@inpti.ga';
};
const isDirectorAccountEmail = (email?: string) => normalizeAccountEmail(email) === 'directeur@inptic.ga';
const isAdminAccountEmail = (email?: string) => {
  const normalized = normalizeAccountEmail(email);
  const configured = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return (
    normalized === 'admin@inptic.ga' ||
    normalized.startsWith('admin@') ||
    normalized === 'yesseboukinda@gmail.com' ||
    normalized === 'yessemabicka@gmail.com' ||
    configured.includes(normalized)
  );
};

const socialProviders = [
  { name: 'Google', icon: '/connexion/google_icon.svg' },
  { name: 'Apple', icon: '/connexion/apple_icon.svg' },
  { name: 'Facebook', icon: '/connexion/facebook_icon.svg' },
] as const;

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

const buildSupabaseProfile = (user: any, fallbackName = 'Étudiant') => {
  const rawRole = user?.user_metadata?.role ?? user?.user_metadata?.roles ?? user?.app_metadata?.role ?? user?.app_metadata?.roles ?? '';
  const normalizedRole = normalizeRole(rawRole);
  const staffRole = isSpecialStaffEmail(user?.email)
    ? 'direction_etudes'
    : isAdminAccountEmail(user?.email)
    ? 'admin'
    : getStaffRole(normalizedRole);
  const isDirector = isDirectorRole(normalizedRole) || isDirectorAccountEmail(user?.email);

  return {
    email: user?.email || '',
    name: user?.user_metadata?.full_name || user?.user_metadata?.name || fallbackName,
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
};

function SocialAuthButtons({ onClick, t }: { onClick: (provider: (typeof socialProviders)[number]['name']) => void; t: (key: string, options?: Record<string, string>) => string }) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        <span>{t('candidate.or')}</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {socialProviders.map(({ name, icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => onClick(name)}
            className="flex appearance-none items-center justify-center rounded-xl border-0 bg-transparent p-2 text-slate-700 shadow-none transition duration-200 hover:scale-110 hover:bg-transparent hover:text-blue-700 focus:outline-none focus:ring-0 focus-visible:outline-none"
            aria-label={t('candidate.socialLogin', { provider: name })}
            title={t('candidate.socialLogin', { provider: name })}
          >
            <img src={icon} alt={name} className="h-7 w-7" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Candidat() {
  const { t } = useTranslation();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [isLoginPasswordVisible, setIsLoginPasswordVisible] = useState(false);
  const [isSignupPasswordVisible, setIsSignupPasswordVisible] = useState(false);

  const handleSocialAuth = async (provider: (typeof socialProviders)[number]['name']) => {
    localStorage.removeItem('inptic_logout_guard');
    const providerKey = provider.toLowerCase() as 'google' | 'apple' | 'facebook';

    if (!supabase) {
      setMsg('Connexion sociale non disponible. Configurez Supabase pour activer Google, Apple et Facebook.');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerKey,
        options: {
          redirectTo: `${window.location.origin}/candidat`,
        },
      });

      if (error) {
        setMsg(error.message || `La connexion avec ${provider} a échoué.`);
      }
    } catch (error) {
      setMsg(error instanceof Error ? error.message : `La connexion avec ${provider} a échoué.`);
    }
  };

  useEffect(() => {
    if (!msg) return;

    const timeout = window.setTimeout(() => setMsg(''), 2000);
    return () => window.clearTimeout(timeout);
  }, [msg]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const logoutGuard = Number(localStorage.getItem('inptic_logout_guard') || '0');
    const hasRecentLogout = Date.now() - logoutGuard < 15000;

    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'SIGNED_IN' || !session?.user || hasRecentLogout) return;

      const user = session.user;
      const profile = buildSupabaseProfile(user, user.user_metadata?.full_name || user.user_metadata?.name || 'Étudiant');
      const localRole = normalizeRole(profile.role);
      const staffRole = getStaffRole(localRole);

      if (isDirectorRole(localRole) || isDirectorAccountEmail(profile.email)) {
        localStorage.removeItem('inptic_user');
        localStorage.setItem('inptic_directeur', JSON.stringify({ email: profile.email, name: profile.name || 'Directeur général', role: 'directeur' }));
        window.dispatchEvent(new Event('auth-state-changed'));
        router.replace('/directeur');
        return;
      }

      if (staffRole) {
        localStorage.removeItem('inptic_user');
        localStorage.setItem('inptic_staff', JSON.stringify({ email: profile.email, name: profile.name, role: staffRole }));
        window.dispatchEvent(new Event('auth-state-changed'));
        router.replace(getRolePath(staffRole));
        return;
      }

      persistLocalProfile(profile);
      router.replace(profile.dossierValide ? '/vie-etudiante' : '/admissions/suivi');
    });

    const syncUserFromSupabaseSession = async () => {
      if (hasRecentLogout) return;

      const { data } = await client.auth.getSession();
      const user = data.session?.user;
      if (!user) return;

      const profile = buildSupabaseProfile(user, user.user_metadata?.full_name || user.user_metadata?.name || 'Étudiant');
      const localRole = normalizeRole(profile.role);
      const staffRole = getStaffRole(localRole);

      if (isDirectorRole(localRole) || isDirectorAccountEmail(profile.email)) {
        localStorage.removeItem('inptic_user');
        localStorage.setItem('inptic_directeur', JSON.stringify({ email: profile.email, name: profile.name || 'Directeur général', role: 'directeur' }));
        window.dispatchEvent(new Event('auth-state-changed'));
        router.replace('/directeur');
        return;
      }

      if (staffRole) {
        localStorage.removeItem('inptic_user');
        localStorage.setItem('inptic_staff', JSON.stringify({ email: profile.email, name: profile.name, role: staffRole }));
        window.dispatchEvent(new Event('auth-state-changed'));
        router.replace(getRolePath(staffRole));
        return;
      }

      persistLocalProfile(profile);
      router.replace(profile.dossierValide ? '/vie-etudiante' : '/admissions/suivi');
    };

    const storedRaw = localStorage.getItem('inptic_user');
    const director = localStorage.getItem('inptic_directeur');

    if (director) {
      router.replace('/directeur');
      return () => subscription.unsubscribe();
    }

    if (storedRaw) {
      try {
        const stored = JSON.parse(storedRaw);
        const storedRole = normalizeRole(stored?.role);
        if (isDirectorRole(storedRole) || isDirectorAccountEmail(stored?.email)) {
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
      return () => subscription.unsubscribe();
    }

    syncUserFromSupabaseSession();
    return () => subscription.unsubscribe();
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
      if (isDirectorRole(localRole) || isDirectorAccountEmail(profile.email)) {
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
      const staffRole = isSpecialStaffEmail(user?.email)
        ? 'direction_etudes'
        : isAdminAccountEmail(user?.email)
        ? 'admin'
        : getStaffRole(normalizedRole);
      const isDirector =
        isDirectorRole(normalizedRole) ||
        isDirectorAccountEmail(user?.email);
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
        const localStaffRole = isSpecialStaffEmail(profile.email)
          ? 'direction_etudes'
          : isAdminAccountEmail(profile.email)
          ? 'admin'
          : getStaffRole(localRole);
        if (isDirectorRole(localRole) || isDirectorAccountEmail(profile.email)) {
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

      const message = error instanceof Error ? translateAuthError(error.message, t) : t('auth.genericError');
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
        ? translateAuthError(error.message, t)
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
      <div className="mx-auto max-w-5xl grid gap-8 rounded-3xl bg-white p-6 md:grid-cols-[1.1fr_1fr] md:p-10">
        <section className="rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-600 p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">{t('common.login')}</p>
          <h1 className="mt-3 text-4xl font-black">{t('pages.account')}</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-blue-50">
            {t('candidate.intro')}
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
              <span className="btn-label">{t('common.login')}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              aria-label={t('candidate.joinExam')}
              className={`mobile-icon-action rounded-xl px-4 py-3 font-semibold transition ${
                mode === 'signup' ? 'bg-white text-blue-700' : 'bg-blue-500/20 text-white border border-blue-300/30'
              }`}
            >
              <UserPlus size={18} aria-hidden="true" />
              <span className="btn-label">{t('candidate.joinExam')}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('forgot')}
              aria-label={t('candidate.forgot')}
              className={`mobile-icon-action rounded-xl px-4 py-3 font-semibold transition ${
                mode === 'forgot' ? 'bg-white text-blue-700' : 'bg-blue-500/20 text-white border border-blue-300/30'
              }`}
            >
              <KeyRound size={18} aria-hidden="true" />
              <span className="btn-label">{t('candidate.forgot')}</span>
            </button>
          </div>

          <div className="mt-8 rounded-2xl border border-white/15 bg-slate-950/15 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">{t('candidate.session')}</p>
            <p className="mt-2 text-lg font-bold">2026-2027</p>
            <p className="mt-1 text-sm text-blue-50">{t('candidate.openUntil')}</p>
          </div>

          <ol className="mt-6 space-y-3 text-sm text-blue-50">
            <li className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white font-bold text-blue-700">1</span>{t('candidate.createAccount')}</li>
            <li className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 font-bold text-white">2</span>{t('candidate.completeFile')}</li>
            <li className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 font-bold text-white">3</span>{t('candidate.followValidation')}</li>
          </ol>
        </section>

        <section className="flex items-center">
          {mode === 'login' ? (
            <form onSubmit={login} className="w-full">
              <h2 className="text-2xl font-bold text-slate-900">{t('candidate.login')}</h2>
              <p className="mt-2 text-sm text-slate-500">{t('candidate.accountAccess')}</p>

              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t('candidate.email')}
                className="mt-6 w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <div className="relative mt-3">
                <input
                  required
                  type={isLoginPasswordVisible ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={t('candidate.password')}
                  className="w-full rounded-xl border border-slate-200 p-3 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setIsLoginPasswordVisible((visible) => !visible)}
                  aria-label={isLoginPasswordVisible ? t('candidate.hidePassword') : t('candidate.showPassword')}
                  title={isLoginPasswordVisible ? t('candidate.hidePassword') : t('candidate.showPassword')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 transition hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isLoginPasswordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>

              <button
                type="submit"
                aria-label={t('candidate.loginButton')}
                className="mobile-icon-action mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <LogIn size={18} aria-hidden="true" />
                <span className="btn-label">{t('candidate.loginButton')}</span>
              </button>

              <SocialAuthButtons onClick={handleSocialAuth} t={t} />

              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                {t('candidate.forgotQuestion')}
              </button>
            </form>
          ) : mode === 'forgot' ? (
            <form onSubmit={requestPasswordReset} className="w-full">
              <h2 className="text-2xl font-bold text-slate-900">{t('candidate.recoverTitle')}</h2>
              <p className="mt-2 text-sm text-slate-500">{t('candidate.recoverText')}</p>

              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t('candidate.email')}
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
              <h2 className="text-2xl font-bold text-slate-900">{t('candidate.signupTitle')}</h2>
              <p className="mt-2 text-sm text-slate-500">{t('candidate.signupText')}</p>

              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('candidate.fullName')}
                className="mt-6 w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t('candidate.email')}
                className="mt-3 w-full rounded-xl border border-slate-200 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <div className="relative mt-3">
                <input
                  required
                  type={isSignupPasswordVisible ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={t('candidate.passwordCreate')}
                  className="w-full rounded-xl border border-slate-200 p-3 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setIsSignupPasswordVisible((visible) => !visible)}
                  aria-label={isSignupPasswordVisible ? t('candidate.hidePassword') : t('candidate.showPassword')}
                  title={isSignupPasswordVisible ? t('candidate.hidePassword') : t('candidate.showPassword')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 transition hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isSignupPasswordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>

              <button
                type="submit"
                aria-label={t('candidate.joinExam')}
                className="mobile-icon-action mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <UserPlus size={18} aria-hidden="true" />
                <span className="btn-label">{t('candidate.joinExam')}</span>
              </button>

              <SocialAuthButtons onClick={handleSocialAuth} t={t} />
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

