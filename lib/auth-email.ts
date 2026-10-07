import 'server-only';

export async function sendAuthEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_FROM_EMAIL || process.env.NEWSLETTER_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error('Configurez RESEND_API_KEY et AUTH_FROM_EMAIL pour envoyer les courriels d’authentification.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`L’envoi du courriel d’authentification a échoué (HTTP ${response.status}).`);
  }
}
