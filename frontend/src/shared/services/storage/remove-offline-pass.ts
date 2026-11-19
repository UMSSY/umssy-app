import { readAccessTokenSubject } from '@/shared/utils/read-access-token-subject';
import { getAccessToken } from './access-token-storage';
import { updateOwnedOfflinePasses } from './offline-passes-owner';
import { addPendingPassRemoval } from './pending-offline-pass-removals';

export async function removeOfflinePass(registrationId: string, accessToken: string): Promise<void> {
  const userId = readAccessTokenSubject(accessToken);
  if (!userId || getAccessToken() !== accessToken) return;
  await updateOwnedOfflinePasses(userId, (value) => {
    if (getAccessToken() !== accessToken || !value || typeof value !== 'object') return undefined;
    const snapshot = value as { userId?: unknown; passes?: unknown; savedAt?: unknown };
    if (snapshot.userId !== userId || !Array.isArray(snapshot.passes)) return undefined;
    return { ...snapshot, savedAt: new Date().toISOString(), passes: snapshot.passes.filter((pass: unknown) =>
      pass && typeof pass === 'object' && 'id' in pass && pass.id !== registrationId) };
  });
}

// The server already cancelled the registration: a local storage failure must not
// turn that into an error, so the removal is retried the next time passes are read.
export async function removeOfflinePassOrDefer(
  registrationId: string,
  accessToken: string,
): Promise<boolean> {
  try {
    await removeOfflinePass(registrationId, accessToken);
    return true;
  } catch {
    const userId = readAccessTokenSubject(accessToken);
    if (userId) addPendingPassRemoval(userId, registrationId);
    return false;
  }
}
