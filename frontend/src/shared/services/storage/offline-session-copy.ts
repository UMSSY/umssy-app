import { ACCESS_TOKEN_STORAGE_KEY } from '@/shared/constants/auth.constants';
import { getAccessToken } from './access-token-storage';
import { readIndexedDbPair, updateIndexedDbPair } from './browser-indexed-db';

// Each read and write checks the persisted session in the same transaction.
export async function withOfflineSessionCopy<T>(
  key: string,
  token: string | null | undefined,
  fetchData: () => Promise<T>,
): Promise<T> {
  const storageKey = 'umssy:session-draft:offline:' + key;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const [storedToken, copy] = await readIndexedDbPair(
      ACCESS_TOKEN_STORAGE_KEY,
      storageKey,
    );
    const saved = copy as { token?: string; data?: T } | null;
    if (
      token &&
      storedToken === token &&
      getAccessToken() === token &&
      saved?.token === token &&
      saved.data !== undefined
    )
      return saved.data;
    throw new Error('Conéctate para descargar estos datos.');
  }
  const data = await fetchData();
  if (token && getAccessToken() === token) {
    await updateIndexedDbPair(
      ACCESS_TOKEN_STORAGE_KEY,
      () => storageKey,
      (storedToken) =>
        storedToken === token && getAccessToken() === token
          ? { secondary: { token, data } }
          : {},
    ).catch(() => undefined);
  }
  return data;
}
