'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, LoaderCircle, Mail, X } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

type AccountSettingsModalProps = {
  email: string;
  onClose: () => void;
};

export default function AccountSettingsModal({ email, onClose }: AccountSettingsModalProps) {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailPasswordVisible, setEmailPasswordVisible] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const updateEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailBusy(true);
    setEmailError('');
    setEmailMessage('');
    try {
      const response = await fetch('/api/auth/account/email', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, currentPassword: emailPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Impossible de demander le changement d’adresse.');
      setEmailMessage(result.message || 'Un lien de confirmation a été envoyé à la nouvelle adresse.');
      setNewEmail('');
      setEmailPassword('');
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Impossible de demander le changement d’adresse.');
    } finally {
      setEmailBusy(false);
    }
  };

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmation) {
      setPasswordError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setPasswordBusy(true);
    try {
      const response = await fetch('/api/auth/account/password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Impossible de modifier le mot de passe.');

      const { error } = await authClient.auth.signOut();
      if (error) {
        setPasswordError('Le mot de passe a été modifié. Reconnecte-toi pour fermer cette session.');
      }
      onClose();
      router.replace('/candidat?passwordChanged=1');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Impossible de modifier le mot de passe.');
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !emailBusy && !passwordBusy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-settings-title"
        className="my-auto max-h-[min(92vh,900px)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Paramètres du compte</p>
            <h2 id="account-settings-title" className="mt-1 text-2xl font-black text-slate-900">Sécurité et coordonnées</h2>
            <p className="mt-2 break-all text-sm text-slate-600">Adresse actuelle : {email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={emailBusy || passwordBusy}
            aria-label="Fermer les paramètres"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="mt-6 grid gap-5">
          <form onSubmit={updateEmail} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
            <h3 className="flex items-center gap-2 font-bold text-slate-900">
              <Mail size={18} className="text-violet-700" aria-hidden="true" />
              Changer l’adresse e-mail
            </h3>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              La nouvelle adresse de connexion sera activée après confirmation du lien reçu. L’adresse actuelle reste active jusque-là.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Nouvelle adresse
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Mot de passe actuel
                <div className="relative mt-1.5">
                  <input
                    type={emailPasswordVisible ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={emailPassword}
                    onChange={(event) => setEmailPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-11 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                  <button
                    type="button"
                    onClick={() => setEmailPasswordVisible((visible) => !visible)}
                    aria-label={emailPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    title={emailPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {emailPasswordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </label>
            </div>
            {emailError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{emailError}</p>}
            {emailMessage && <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{emailMessage}</p>}
            <button
              type="submit"
              disabled={emailBusy}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {emailBusy ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Mail size={16} aria-hidden="true" />}
              Envoyer la confirmation
            </button>
          </form>

          <form onSubmit={updatePassword} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
            <h3 className="flex items-center gap-2 font-bold text-slate-900">
              <KeyRound size={18} className="text-violet-700" aria-hidden="true" />
              Changer le mot de passe
            </h3>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Après le changement, les sessions ouvertes sur les autres appareils seront fermées et tu devras te reconnecter.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Mot de passe actuel
                <div className="relative mt-1.5">
                  <input
                    type={currentPasswordVisible ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-11 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentPasswordVisible((visible) => !visible)}
                    aria-label={currentPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    title={currentPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {currentPasswordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Nouveau mot de passe
                <div className="relative mt-1.5">
                  <input
                    type={newPasswordVisible ? 'text' : 'password'}
                    required
                    minLength={6}
                    maxLength={256}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-11 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPasswordVisible((visible) => !visible)}
                    aria-label={newPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    title={newPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {newPasswordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Confirmer le nouveau mot de passe
                <div className="relative mt-1.5">
                  <input
                    type={confirmationVisible ? 'text' : 'password'}
                    required
                    minLength={6}
                    maxLength={256}
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-11 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmationVisible((visible) => !visible)}
                    aria-label={confirmationVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    title={confirmationVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {confirmationVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </label>
            </div>
            {passwordError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</p>}
            <button
              type="submit"
              disabled={passwordBusy}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordBusy ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <KeyRound size={16} aria-hidden="true" />}
              Mettre à jour le mot de passe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
