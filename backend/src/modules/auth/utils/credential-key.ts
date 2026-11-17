import { createHash } from 'node:crypto';

export function credentialKey(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}
