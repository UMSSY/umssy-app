import { ACCESS_TOKEN_STORAGE_KEY } from '@/shared/constants/auth.constants';
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
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const [storedToken, copy] = await readIndexedDbPair(
      ACCESS_TOKEN_STORAGE_KEY,
      storageKey,
    );
    const saved = copy as { token?: string; data?: T } | null;
    options.signal?.throwIfAborted();
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
  options.signal?.throwIfAborted();
  if (options.requireStorage && (!token || getAccessToken() !== token))
    throw new Error('La sesión cambió durante la preparación.');
  let stored = false;
  if (token && getAccessToken() === token) {
    await updateIndexedDbPair(
      ACCESS_TOKEN_STORAGE_KEY,
      () => storageKey,
      (storedToken) => {
        if (
          storedToken !== token ||
          getAccessToken() !== token ||
          options.signal?.aborted
        )
          return {};
        stored = true;
        return { secondary: { token, data } };
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
