'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
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
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token') || '';
    setResetToken(token);
    setIsReady(/^[a-f0-9]{64}$/i.test(token));
    if (token) window.history.replaceState({}, document.title, url.pathname);
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      setMessage('Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau.');
    }
  }, []);

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

    if (!isReady || !resetToken) {
      setMessage(t('pages.invalidRecovery'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'La mise à jour du mot de passe a échoué.');
      setMessage(t('pages.passwordUpdated'));
      await authClient.auth.signOut();
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