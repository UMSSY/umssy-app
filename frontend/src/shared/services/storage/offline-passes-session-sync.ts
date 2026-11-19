import { readAccessTokenSubject } from '@/shared/utils/read-access-token-subject';
import { claimOfflinePasses, endOfflinePassesSession } from './offline-passes-owner';

export function syncOfflinePassesSession(
  previous: string | null,
  current: string | null,
): Promise<void> {
  if (previous === current) return Promise.resolve();
  const previousUser = readAccessTokenSubject(previous);
  if (!current)
    return previousUser ? endOfflinePassesSession(previousUser) : Promise.resolve();
  const nextUser = readAccessTokenSubject(current);
  if (!nextUser || previousUser === nextUser) return Promise.resolve();
  return claimOfflinePasses(nextUser);
}
