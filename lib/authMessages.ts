export function translateAuthError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect.';
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Votre adresse email n’est pas encore confirmée.';
  }

  if (normalizedMessage.includes('user already registered')) {
    return 'Un compte existe déjà avec cette adresse email.';
  }

  if (normalizedMessage.includes('password should be at least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }

  if (normalizedMessage.includes('rate limit')) {
    return 'Trop de tentatives. Veuillez patienter avant de réessayer.';
  }

  if (/[àâçéèêëîïôùûüÿœ]|\b(le|la|les|un|une|votre|mot|email|erreur|compte)\b/i.test(message)) {
    return message;
  }

  return 'Une erreur est survenue. Vérifiez vos informations et réessayez.';
}