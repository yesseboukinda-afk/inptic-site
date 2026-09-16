type Translator = (key: string) => string;

export function translateAuthError(message: string, translate?: Translator) {
  const normalizedMessage = message.toLowerCase();
  const t = translate ?? ((key: string) => key);

  if (normalizedMessage.includes('invalid login credentials')) {
    return t('auth.invalidCredentials');
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return t('auth.emailNotConfirmed');
  }

  if (normalizedMessage.includes('user already registered')) {
    return t('auth.userAlreadyRegistered');
  }

  if (normalizedMessage.includes('password should be at least')) {
    return t('auth.passwordTooShort');
  }

  if (normalizedMessage.includes('rate limit')) {
    return t('auth.rateLimit');
  }

  if (/[àâçéèêëîïôùûüÿœ]|\b(le|la|les|un|une|votre|mot|email|erreur|compte)\b/i.test(message)) {
    return message;
  }

  return t('auth.genericError');
}

export function translateNotification(message: string, translate?: Translator) {
  const t = translate ?? ((key: string) => key);
  const translations: Record<string, string> = {
    'Votre dossier a été soumis avec succès. Il est désormais en cours de validation par l’administration.': 'notifications.applicationSubmitted',
    'Votre dossier a été validé. Vous pouvez maintenant accéder à votre espace personnel.': 'notifications.applicationValidated',
    'Votre dossier a été refusé. Vérifiez les informations et les justificatifs avant de réessayer.': 'notifications.applicationRejected',
    'Aucune notification pour le moment.': 'notifications.empty',
  };

  return translations[message] ? t(translations[message]) : message;
}