import { readAccessTokenSubject } from '@/shared/utils/read-access-token-subject';
import { claimOfflinePasses, clearOfflinePasses } from './offline-passes-owner';
import { activateOfflineUser, revokeOfflineUser } from './offline-passes-session';

export function syncOfflinePassesSession(
  previous: string | null,
  current: string | null,
): Promise<void> {
  const nextUser = readAccessTokenSubject(current);
  if (nextUser) activateOfflineUser(nextUser);
  else if (previous && !current) revokeOfflineUser();
  if (previous === current) return Promise.resolve();
  if (!current) return previous ? clearOfflinePasses() : Promise.resolve();
  if (!nextUser || (previous && readAccessTokenSubject(previous) === nextUser))
    return Promise.resolve();
  return claimOfflinePasses(nextUser);
}
