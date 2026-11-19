import { readAccessTokenSubject } from '@/shared/utils/read-access-token-subject';
import { claimOfflinePasses, clearOfflinePasses } from './offline-passes-owner';

export function syncOfflinePassesSession(
  previous: string | null,
  current: string | null,
): Promise<void> {
  if (!previous || previous === current) return Promise.resolve();
  if (!current) return clearOfflinePasses();
  const nextUser = readAccessTokenSubject(current);
  if (!nextUser || readAccessTokenSubject(previous) === nextUser)
    return Promise.resolve();
  return claimOfflinePasses(nextUser);
}
