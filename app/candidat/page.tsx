'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, LogIn, UserPlus } from 'lucide-react';
import { Lottie } from 'lottie-react';
import { authClient } from '@/lib/auth-client';
import { translateAuthError } from '@/lib/authMessages';
import { getRolePath, getStaffRole, isDirectorRole, isRHRole, isSuperAdminRole, normalizeRole } from '@/lib/roles';
import { useTranslation } from 'react-i18next';
import { getCandidateJourneyPath } from '@/lib/admissionsWorkflow';

const generateDossierNumber = () => `INPTIC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

const socialProviders = [
  { provider: 'google', name: 'Google', icon: '/connexion/google_icon.svg' },
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
  const existingProfiles: Record<string, any>[] = readLocalProfiles();
  let existingUser: Record<string, any> = {};
  try {
    const raw = localStorage.getItem('inptic_user');
    existingUser = raw ? JSON.parse(raw) : {};
  } catch {
    existingUser = {};
  }
  delete existingUser.password;
  const safeProfile = { ...profile };
  delete safeProfile.password;
  const persistedProfile: Record<string, any> = {
    ...existingUser,
    ...safeProfile,
    admissionWorkflow: safeProfile.admissionWorkflow ?? existingUser.admissionWorkflow,
    candidatureData: safeProfile.candidatureData ?? existingUser.candidatureData,
    documents: Array.isArray(safeProfile.documents) && safeProfile.documents.length
      ? safeProfile.documents
      : existingUser.documents ?? [],
    paymentStatus: safeProfile.paymentStatus ?? existingUser.paymentStatus,
    paymentReference: safeProfile.paymentReference ?? existingUser.paymentReference,
    paymentTransactionId: safeProfile.paymentTransactionId ?? existingUser.paymentTransactionId,
    paymentDate: safeProfile.paymentDate ?? existingUser.paymentDate,
    dossierNumero: safeProfile.dossierNumero || existingUser.dossierNumero,
  };
  const nextProfiles = existingProfiles.some((entry) => entry.email?.toLowerCase() === persistedProfile.email?.toLowerCase())
    ? existingProfiles.map((entry: any) =>
        entry.email?.toLowerCase() === persistedProfile.email?.toLowerCase()
          ? { ...entry, ...persistedProfile, role: profile.role || entry.role || 'etudiant' }
          : entry
      )
    : [...existingProfiles, { ...persistedProfile, role: profile.role || 'etudiant' }];

  localStorage.setItem('inptic_users', JSON.stringify(nextProfiles.map((entry) => {
    const safeEntry = { ...entry };
    delete safeEntry.password;
    return safeEntry;
  })));
  localStorage.setItem('inptic_user', JSON.stringify(persistedProfile));
  window.dispatchEvent(new Event('auth-state-changed'));
};

const getCandidateDestination = (profile?: Record<string, any>) => {
  let storedProfile: Record<string, any> = {};
  try {
    const raw = localStorage.getItem('inptic_user');
    storedProfile = raw ? JSON.parse(raw) : {};
  } catch {
    storedProfile = {};
  }
  const mergedProfile = {
    ...storedProfile,
    ...profile,
    admissionWorkflow: profile?.admissionWorkflow ?? storedProfile.admissionWorkflow,
    candidatureData: profile?.candidatureData ?? storedProfile.candidatureData,
    documents: profile?.documents?.length ? profile.documents : storedProfile.documents ?? [],
    paymentStatus: profile?.paymentStatus ?? storedProfile.paymentStatus,
  };
  return getCandidateJourneyPath(mergedProfile);
};

const buildAuthProfile = (user: any, fallbackName = 'Étudiant') => {
  const rawRole = user?.app_metadata?.role ?? user?.app_metadata?.roles ?? '';
  const normalizedRole = normalizeRole(rawRole);
  const staffRole = getStaffRole(normalizedRole);
  const isDirector = isDirectorRole(normalizedRole);

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

function SocialAuthButtons({ onClick, t }: { onClick: (provider: (typeof socialProviders)[number]['provider']) => void; t: (key: string, options?: Record<string, string>) => string }) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        <span>{t('candidate.or')}</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="flex justify-center">
        {socialProviders.map(({ provider, name, icon }) => (
          <button
            key={provider}
            type="button"
            onClick={() => onClick(provider)}
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
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const loginNavigationTimer = useRef<number | null>(null);
  const isPasswordLoginInProgress = useRef(false);

  const navigateAfterLogin = (destination: string, method: 'push' | 'replace', animate: boolean) => {
    isPasswordLoginInProgress.current = false;
    if (loginNavigationTimer.current !== null) {
      window.clearTimeout(loginNavigationTimer.current);
      loginNavigationTimer.current = null;
    }

    if (!animate) {
      setShowLoginSuccess(false);
      router[method](destination);
      return;
    }

    setShowLoginSuccess(true);
    loginNavigationTimer.current = window.setTimeout(() => {
      setShowLoginSuccess(false);
      loginNavigationTimer.current = null;
      router[method](destination);
    }, 1400);
  };

  const handleSocialAuth = async (provider: (typeof socialProviders)[number]['provider']) => {
    const providerName = socialProviders.find((item) => item.provider === provider)?.name ?? provider;
    try {
      const { error } = await authClient.auth.signInWithOAuth({ provider });
      if (error) {
        setMsg(error.message || `La connexion avec ${providerName} a échoué.`);
      }
    } catch (error) {
      setMsg(error instanceof Error ? error.message : `La connexion avec ${providerName} a échoué.`);
    }
  };

  useEffect(() => {
    if (!msg) return;

    const timeout = window.setTimeout(() => setMsg(''), 2000);
    return () => window.clearTimeout(timeout);
  }, [msg]);

  useEffect(() => {
    const routeAuthenticatedUser = (user: any, animate: boolean) => {
      const profile = buildAuthProfile(user);
      const role = normalizeRole(user?.app_metadata?.role);
      localStorage.removeItem('inptic_user');
      localStorage.removeItem('inptic_staff');
      localStorage.removeItem('inptic_directeur');

      if (isSuperAdminRole(role)) {
        localStorage.setItem('inptic_staff', JSON.stringify({ email: profile.email, name: profile.name, role: 'admin' }));
        localStorage.setItem('inptic_directeur', JSON.stringify({ email: profile.email, name: profile.name, role }));
        navigateAfterLogin('/admin', 'replace', animate);
      } else if (isRHRole(role)) {
        localStorage.setItem('inptic_staff', JSON.stringify({ email: profile.email, name: profile.name, role: 'admin', service: 'rh' }));
        navigateAfterLogin('/admin/rh', 'replace', animate);
      } else if (role === 'scolarite') {
        localStorage.setItem('inptic_staff', JSON.stringify({ email: profile.email, name: profile.name, role }));
        navigateAfterLogin('/scolarite', 'replace', animate);
      } else if (isDirectorRole(role)) {
        localStorage.setItem('inptic_directeur', JSON.stringify({ email: profile.email, name: profile.name, role }));
        navigateAfterLogin('/directeur', 'replace', animate);
      } else if (getStaffRole(role)) {
        const staffRole = getStaffRole(role);
        localStorage.setItem(
          'inptic_staff',
          JSON.stringify({
            email: profile.email,
            name: profile.name,
            role: staffRole,
            service: user?.user_metadata?.service ?? user?.user_metadata?.department,
          }),
        );
        navigateAfterLogin(getRolePath(
          staffRole,
          profile.email,
          user?.user_metadata?.service ?? user?.user_metadata?.department,
        ), 'replace', animate);
      } else {
        persistLocalProfile(profile);
        navigateAfterLogin(getCandidateDestination(profile), 'replace', animate);
      }
      window.dispatchEvent(new Event('auth-state-changed'));
    };

    const { data: { subscription } } = authClient.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        if (event !== 'SIGNED_IN' || !isPasswordLoginInProgress.current) {
          routeAuthenticatedUser(session.user, event === 'SIGNED_IN');
        }
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('inptic_user');
        localStorage.removeItem('inptic_staff');
        localStorage.removeItem('inptic_directeur');
        window.dispatchEvent(new Event('auth-state-changed'));
      }
    });

    const query = new URLSearchParams(window.location.search);
    if (query.get('verified') === '1' && query.get('emailChanged') === '1') {
      setMsg('Nouvelle adresse e-mail confirmée. Connectez-vous avec cette adresse.');
    } else if (query.get('verified') === '1') {
      setMsg('Adresse e-mail confirmée. Votre compte est activé.');
    }
    if (query.get('passwordChanged') === '1') setMsg('Mot de passe modifié. Connectez-vous avec le nouveau mot de passe.');
    if (query.get('authError') === 'email-change-conflict') {
      setMsg('Cette adresse e-mail est déjà associée à un compte ou à un dossier.');
    } else if (query.has('authError')) {
      setMsg('La validation du lien ou la connexion a échoué. Réessayez.');
    }
    return () => {
      subscription.unsubscribe();
      if (loginNavigationTimer.current !== null) {
        window.clearTimeout(loginNavigationTimer.current);
      }
    };
  }, [router]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    isPasswordLoginInProgress.current = true;

    try {
      const { data, error } = await authClient.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Compte utilisateur absent de la réponse de connexion.');
      }

      const user = data.user;
      const rawRole = user?.app_metadata?.role ?? user?.app_metadata?.roles ?? '';
      const normalizedRole = normalizeRole(rawRole);
      const staffRole = getStaffRole(normalizedRole);
      const isDirector = isDirectorRole(normalizedRole);
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

      if (isSuperAdminRole(normalizedRole)) {
        localStorage.removeItem('inptic_user');
        localStorage.setItem('inptic_staff', JSON.stringify({ email: profile.email, name: profile.name, role: 'admin' }));
        localStorage.setItem('inptic_directeur', JSON.stringify({ email: profile.email, name: profile.name, role: normalizedRole }));
        window.dispatchEvent(new Event('auth-state-changed'));
        navigateAfterLogin('/admin', 'push', true);
        return;
      }

      const isRH = isRHRole(normalizedRole);
      if (isRH) {
        localStorage.removeItem('inptic_user');
        localStorage.setItem(
          'inptic_staff',
          JSON.stringify({ email: profile.email, name: profile.name || 'Gestionnaire RH', role: 'admin', service: 'rh' })
        );
        window.dispatchEvent(new Event('auth-state-changed'));
        navigateAfterLogin('/admin/rh', 'push', true);
        return;
      }

      const isScolarite = normalizedRole === 'scolarite';
      if (isScolarite) {
        localStorage.removeItem('inptic_user');
        localStorage.setItem(
          'inptic_staff',
          JSON.stringify({ email: profile.email, name: profile.name || 'Direction de la Scolarité', role: 'scolarite', service: 'scolarite' })
        );
        window.dispatchEvent(new Event('auth-state-changed'));
        navigateAfterLogin('/scolarite', 'push', true);
        return;
      }

      if (isDirector) {
        localStorage.removeItem('inptic_user');
        localStorage.setItem(
          'inptic_directeur',
          JSON.stringify({ email: profile.email, name: profile.name || 'Directeur général', role: 'directeur' })
        );
        window.dispatchEvent(new Event('auth-state-changed'));
        navigateAfterLogin('/directeur', 'push', true);
        return;
      }

      if (staffRole) {
        localStorage.removeItem('inptic_user');
        localStorage.setItem(
          'inptic_staff',
          JSON.stringify({
            email: profile.email,
            name: profile.name,
            role: staffRole,
            service: user?.user_metadata?.service ?? user?.user_metadata?.department,
          }),
        );
        window.dispatchEvent(new Event('auth-state-changed'));
        navigateAfterLogin(getRolePath(
          staffRole,
          profile.email,
          user?.user_metadata?.service ?? user?.user_metadata?.department,
        ), 'push', true);
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

      const profileResponse = await fetch('/api/candidat/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!profileResponse.ok) {
        const result = await profileResponse.json().catch(() => ({}));
        throw new Error(result.error || 'Le profil candidat n’a pas pu être sauvegardé.');
      }

      setMsg('Connexion réussie.');
      navigateAfterLogin(getCandidateDestination(profile), 'push', true);
    } catch (error) {
      isPasswordLoginInProgress.current = false;
      if (loginNavigationTimer.current !== null) {
        window.clearTimeout(loginNavigationTimer.current);
        loginNavigationTimer.current = null;
      }
      setShowLoginSuccess(false);
      const message = error instanceof Error ? translateAuthError(error.message, t) : t('auth.genericError');
      setMsg(message);
    }
  }

  async function requestPasswordReset(e: React.FormEvent) {
    e.preventDefault();

    const email = form.email.trim();

    if (!email) {
      setMsg('Saisissez votre adresse email pour recevoir le lien de récupération.');
      return;
    }

    const { error } = await authClient.auth.resetPasswordForEmail(email);
    setMsg(error
      ? translateAuthError(error.message, t)
      : 'Si un compte vérifié existe avec cette adresse, un lien de récupération sera envoyé.');
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      setMsg('Veuillez remplir tous les champs pour vous inscrire au concours.');
      return;
    }

    try {
      const { data, error } = await authClient.auth.signUp({
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

      if (!data.session) {
        setMsg('Compte créé. Confirmez votre adresse e-mail depuis le message reçu : le lien activera votre compte et vous redirigera directement vers le dépôt de dossier.');
        return;
      }

      if (!data.user) {
        throw new Error('Compte utilisateur absent de la réponse d’inscription.');
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

      const profileResponse = await fetch('/api/candidat/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!profileResponse.ok) {
        const result = await profileResponse.json().catch(() => ({}));
        throw new Error(result.error || 'Le profil candidat n’a pas pu être sauvegardé.');
      }

      setMsg('Inscription enregistrée. Votre dossier est en cours de traitement.');
      router.push(getCandidateDestination(profile));
    } catch (error) {
      const message = error instanceof Error ? translateAuthError(error.message, t) : t('auth.genericError');
      setMsg(message);
    }
  }

  return (
    <main
      className="candidate-login-background min-h-screen bg-cover bg-center bg-fixed px-4 py-12"
    >
      {showLoginSuccess && (
        <div
          role="status"
          aria-live="assertive"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center text-center text-white">
            <div className="flex h-80 w-80 max-w-[85vw] items-center justify-center rounded-full bg-white shadow-[0_0_100px_rgba(74,222,128,0.35)]">
              <Lottie
                src="/icons8-check-50.json"
                autoplay
                loop={false}
                className="h-full w-full"
                aria-label="Connexion validée"
              />
            </div>
            <p className="mt-6 text-2xl font-black tracking-wide sm:text-3xl">Connexion validée</p>
            <p className="mt-2 text-sm font-medium text-slate-200">Bienvenue à l’INPTIC</p>
          </div>
        </div>
      )}
      <div className="mx-auto grid max-w-5xl gap-8 rounded-3xl border border-white/30 bg-white/10 p-6 shadow-2xl backdrop-blur-md md:grid-cols-[1.1fr_1fr] md:p-10">
        <section className="rounded-2xl border border-white/15 bg-gradient-to-br from-blue-700/50 to-cyan-600/30 p-8 text-white shadow-lg backdrop-blur-md">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">{t('common.login')}</p>
          <h1 className="mt-3 text-4xl font-black">{t('pages.account')}</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-blue-50">
            {t('candidate.intro')}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row md:flex-col md:items-stretch">
            <button
              type="button"
              onClick={() => setMode('login')}
              aria-label="Je me connecte"
              className={`mobile-icon-action min-w-0 flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
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
              className={`mobile-icon-action min-w-0 flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
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
              className={`mobile-icon-action min-w-0 flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
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
            <li className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 font-bold text-white">2</span>Préinscription au concours</li>
            <li className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 font-bold text-white">3</span>Formulaire et pièces justificatives</li>
            <li className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 font-bold text-white">4</span>Paiement des frais de dossier</li>
          </ol>
        </section>

        <section className="flex items-center">
          {mode === 'login' ? (
            <form onSubmit={login} className="w-full rounded-2xl border border-white/30 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
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
            <form onSubmit={requestPasswordReset} className="w-full rounded-2xl border border-white/30 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
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
            <form onSubmit={handleSignup} className="w-full rounded-2xl border border-white/30 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
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
