import { createHash } from 'node:crypto';

export function getProfileDocumentPrefix(email: string): string {
  const emailHash = createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
  return `profiles/${emailHash}/`;
}
