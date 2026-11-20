import { readAccessTokenSubject } from '@/shared/utils/read-access-token-subject';
import { getAccessToken } from './access-token-storage';
import { readIndexedDb, writeIndexedDb } from './browser-indexed-db';

const isCurrentSession = (token: string | null | undefined): token is string =>
  Boolean(token) && getAccessToken() === token;

export async function withOfflineSessionCopy<T>(
  key: string,
  token: string | null | undefined,
  fetchData: () => Promise<T>,
  options: { signal?: AbortSignal; requireStorage?: boolean } = {},
): Promise<T> {
  options.signal?.throwIfAborted();
  const storageKey = 'umssy:session-draft:offline:' + key;
  const userId = readAccessTokenSubject(token);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const saved = await readIndexedDb<{ userId?: string; token?: string; data?: T }>(storageKey);
    options.signal?.throwIfAborted();
    const ownsCopy = saved?.userId === userId || (saved?.userId === undefined && saved?.token === token);
    if (userId && isCurrentSession(token) && ownsCopy && saved?.data !== undefined) {
      if (saved.userId === undefined)
        void writeIndexedDb(storageKey, { userId, data: saved.data }).catch(() => undefined);
      return saved.data;
    }
    throw new Error('Conéctate para descargar estos datos.');
  }
  const data = await fetchData();
  options.signal?.throwIfAborted();
  if (options.requireStorage && !isCurrentSession(token))
    throw new Error('La sesión cambió durante la preparación.');
  let stored = false;
  if (userId && isCurrentSession(token)) {
    await writeIndexedDb(storageKey, { userId, data })
      .then(() => {
        stored = true;
      })
      .catch((error) => {
        if (options.requireStorage) throw error;
      });
  }
  options.signal?.throwIfAborted();
  if (options.requireStorage && (!stored || !isCurrentSession(token)))
    throw new Error('No se pudo guardar la copia sin conexión.');
  return data;
}
