import 'server-only';
import { sendSmtpEmail } from '@/lib/smtp-email';

export async function sendAuthEmail(to: string, subject: string, html: string, text?: string) {
  await sendSmtpEmail({
    to,
    subject,
    html,
    text: text ?? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  });
}
