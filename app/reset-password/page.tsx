'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { translateAuthError } from '@/lib/authMessages';
import { useTranslation } from 'react-i18next';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setMessage(t('pages.supabaseRequired'));
      return;
    }

    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsReady(true);
        setMessage('');
      }
    });

    let active = true;
    const prepareRecovery = async () => {
      const url = new URL(window.location.href);
      const errorDescription = url.searchParams.get('error_description');
      const errorCode = url.searchParams.get('error_code');
      if (errorDescription || errorCode) {
        setMessage('Ce lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien.');
        return;
      }

      try {
        const code = url.searchParams.get('code');
        const tokenHash = url.searchParams.get('token_hash');
        const type = url.searchParams.get('type');
        let hasRecoverySession = false;

        if (code) {
          const { data: sessionData, error } = await client.auth.exchangeCodeForSession(code);
          if (error) throw error;
          hasRecoverySession = Boolean(sessionData.session);
        } else if (tokenHash && type === 'recovery') {
          const { data: sessionData, error } = await client.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (error) throw error;
          hasRecoverySession = Boolean(sessionData.session);
        } else {
          const fragment = new URLSearchParams(url.hash.slice(1));
          const accessToken = fragment.get('access_token');
          const refreshToken = fragment.get('refresh_token');
          if (accessToken && refreshToken && fragment.get('type') === 'recovery') {
            const { data: sessionData, error } = await client.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
            hasRecoverySession = Boolean(sessionData.session);
          }
        }

        const { data: sessionData, error } = await client.auth.getSession();
        if (error) throw error;
        if (active) {
          setIsReady(hasRecoverySession || Boolean(sessionData.session));
          if (!hasRecoverySession && !sessionData.session) {
            setMessage('Le lien n’a pas ouvert une session de récupération. Demandez un nouveau lien et ouvrez-le depuis le même navigateur.');
          }
          if (code || tokenHash || url.hash) {
            window.history.replaceState({}, document.title, url.pathname);
          }
        }
      } catch (error) {
        if (active) {
          const { data: sessionData } = await client.auth.getSession();
          if (sessionData.session) {
            setIsReady(true);
            setMessage('');
          } else {
            setMessage(error instanceof Error
              ? `Impossible de valider le lien : ${translateAuthError(error.message, t)}`
              : 'Impossible de valider le lien de réinitialisation. Demandez-en un nouveau.');
          }
        }
      }
    };

    void prepareRecovery();

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [t]);

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();

    if (password.length < 6) {
      setMessage(t('pages.passwordShort'));
      return;
    }

    if (password !== confirmation) {
      setMessage(t('pages.passwordMismatch'));
      return;
    }

    if (!supabase || !isReady) {
      setMessage(t('pages.invalidRecovery'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(translateAuthError(error.message, t));
        return;
      }

      setMessage(t('pages.passwordUpdated'));
      await supabase.auth.signOut();
      setTimeout(() => router.replace('/candidat'), 800);
    } catch (error) {
      setMessage(error instanceof Error
        ? `La mise à jour a échoué : ${translateAuthError(error.message, t)}`
        : 'La mise à jour du mot de passe a échoué.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
      <section className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-xl md:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
          <KeyRound size={24} aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-black text-slate-900">{t('pages.newPassword')}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{t('pages.passwordIntro')}</p>

        <form onSubmit={updatePassword} className="mt-8">
          <div className="relative">
            <input
              required
              minLength={6}
              type={isVisible ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t('pages.passwordPlaceholder')}
              className="w-full rounded-xl border border-slate-200 p-3 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => setIsVisible((visible) => !visible)}
              aria-label={isVisible ? t('pages.hidePassword') : t('pages.showPassword')}
              title={isVisible ? t('pages.hidePassword') : t('pages.showPassword')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-blue-600"
            >
              {isVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>

          <div className="relative mt-3">
            <input
              required
              minLength={6}
              type={isConfirmationVisible ? 'text' : 'password'}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={t('pages.confirmPassword')}
              className="w-full rounded-xl border border-slate-200 p-3 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => setIsConfirmationVisible((visible) => !visible)}
              aria-label={isConfirmationVisible ? t('pages.hidePassword') : t('pages.showPassword')}
              title={isConfirmationVisible ? t('pages.hidePassword') : t('pages.showPassword')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-blue-600"
            >
              {isConfirmationVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!isReady || isSubmitting}
            className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {t('pages.savePassword')}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
      </section>
    </main>
  );
}