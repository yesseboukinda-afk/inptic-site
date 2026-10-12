import 'server-only';
import { sendSmtpEmail } from '@/lib/smtp-email';

export async function sendAuthEmail(to: string, subject: string, html: string) {
  await sendSmtpEmail({ to, subject, html });
}
