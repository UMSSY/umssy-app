import { readAccessTokenSubject } from '@/shared/utils/read-access-token-subject';
import { getAccessToken } from './access-token-storage';
import { readIndexedDbPair, updateIndexedDbPair } from './browser-indexed-db';

export async function withOfflineSessionCopy<T>(
  key: string,
  token: string | null | undefined,
  fetchData: () => Promise<T>,
  options: { signal?: AbortSignal; requireStorage?: boolean } = {},
): Promise<T> {
  options.signal?.throwIfAborted();
  const storageKey = 'umssy:session-draft:offline:' + key;
  const ownerKey = 'umssy:session-draft:owner';
  const userId = readAccessTokenSubject(token);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const [storedOwner, copy] = await readIndexedDbPair(
      ownerKey,
      storageKey,
    );
    const saved = copy as { userId?: string; token?: string; data?: T } | null;
    const ownsCopy = saved?.userId === userId || (saved?.userId === undefined && saved?.token === token);
    options.signal?.throwIfAborted();
    if (
      userId &&
      token &&
      (storedOwner == null || storedOwner === userId) &&
      getAccessToken() === token &&
      ownsCopy &&
      saved?.data !== undefined
    ) {
      if (storedOwner == null || saved.token !== undefined) {
        await updateIndexedDbPair(ownerKey, storageKey, () => {
          if (getAccessToken() !== token || options.signal?.aborted) return {};
          return { primary: userId, secondary: { userId, data: saved.data } };
        }).catch(() => {});
      }
      options.signal?.throwIfAborted();
      if (getAccessToken() === token) return saved.data;
    }
    throw new Error('Conéctate para descargar estos datos.');
  }
  const data = await fetchData();
  options.signal?.throwIfAborted();
  if (options.requireStorage && (!userId || !token || getAccessToken() !== token))
    throw new Error('La sesión cambió durante la preparación.');
  let stored = false;
  if (userId && token && getAccessToken() === token) {
    await updateIndexedDbPair(
      ownerKey,
      () => storageKey,
      () => {
        if (
          getAccessToken() !== token ||
          options.signal?.aborted
        )
          return {};
        stored = true;
        return { primary: userId, secondary: { userId, data } };
      },
    ).catch((error) => {
      stored = false;
      if (options.requireStorage) throw error;
    });
  }
  options.signal?.throwIfAborted();
  if (options.requireStorage && (!stored || getAccessToken() !== token))
    throw new Error('No se pudo guardar la copia sin conexión.');
  return data;
}
