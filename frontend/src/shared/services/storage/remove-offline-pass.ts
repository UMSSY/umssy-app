import { ACCESS_TOKEN_STORAGE_KEY } from '@/shared/constants/auth.constants';
import { offlinePassesKey } from '@/shared/constants/offline-passes.constants';
import { readAccessTokenSubject } from '@/shared/utils/read-access-token-subject';
import { getAccessToken } from './access-token-storage';
import { updateIndexedDbPair } from './browser-indexed-db';

export async function removeOfflinePass(registrationId: string, accessToken: string): Promise<void> {
  const userId = readAccessTokenSubject(accessToken);
  if (!userId || getAccessToken() !== accessToken) return;
  await updateIndexedDbPair(ACCESS_TOKEN_STORAGE_KEY, offlinePassesKey(userId), (persistedToken, value) => {
    if (persistedToken !== accessToken || getAccessToken() !== accessToken || !value || typeof value !== 'object') return {};
    const snapshot = value as { userId?: unknown; passes?: unknown; savedAt?: unknown };
    if (snapshot.userId !== userId || !Array.isArray(snapshot.passes)) return {};
    return { secondary: { ...snapshot, savedAt: new Date().toISOString(), passes: snapshot.passes.filter((pass: unknown) =>
      pass && typeof pass === 'object' && 'id' in pass && pass.id !== registrationId) } };
  });
}
