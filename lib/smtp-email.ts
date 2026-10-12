import 'server-only';
import nodemailer from 'nodemailer';

const DEFAULT_FROM = 'INPTIC <inptic@inptic-ga.org>';

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !user || !pass) {
    return null;
  }

  const secureValue = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure = secureValue === 'true' || (secureValue !== 'false' && port === 465);

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    from: process.env.SMTP_FROM_EMAIL?.trim() || DEFAULT_FROM,
  };
}

export function isSmtpEmailConfigured() {
  return getSmtpConfig() !== null;
}

export async function sendSmtpEmail(message: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
}) {
  const config = getSmtpConfig();
  if (!config) {
    throw new Error('L’envoi e-mail n’est pas configuré : renseignez les paramètres SMTP LWS dans l’environnement du serveur.');
  }

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  try {
    const result = await transport.sendMail({
      from: config.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      headers: message.headers,
    });
    return { messageId: result.messageId };
  } finally {
    transport.close();
  }
}
