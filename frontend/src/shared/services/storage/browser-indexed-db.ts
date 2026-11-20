import { createIndexedDbStorage } from './indexed-db-storage';

const storage = createIndexedDbStorage({
  databaseName: 'umssy-business-data',
  storeName: 'drafts',
});

export async function readIndexedDb<T>(key: string): Promise<T | null> {
  if (typeof indexedDB === 'undefined') return null;
  return ((await storage.read(key)) as T | undefined) ?? null;
}

export function writeIndexedDb<T>(key: string, value: T): Promise<void> {
  if (typeof indexedDB === 'undefined')
    return Promise.reject(new Error('IndexedDB no está disponible'));
  return storage.write(key, value);
}

export async function removeIndexedDb(key: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  await storage.remove(key);
}

export function updateIndexedDb<T>(
  key: string,
  update: (current: T | null) => T | null,
): Promise<T | null> {
  if (typeof indexedDB === 'undefined')
    return Promise.reject(new Error('IndexedDB no está disponible'));
  return storage.update(key, update);
}

export async function readIndexedDbByPrefix<T>(prefix: string): Promise<Array<{ key: string; value: T }>> {
  if (typeof indexedDB === "undefined") return [];
  return (await storage.readByPrefix(prefix)) as Array<{ key: string; value: T }>;
}

export async function removeIndexedDbByPrefix(prefix: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  await storage.removeByPrefix(prefix);
}

export function readIndexedDbPair(
  primaryKey: string,
  secondaryKey: string,
): Promise<[unknown, unknown]> {
  if (typeof indexedDB === 'undefined') return Promise.resolve([null, null]);
  return storage.readPair(primaryKey, secondaryKey);
}

export function updateIndexedDbPair(
  ...args: Parameters<typeof storage.updatePair>
): Promise<void> {
  if (typeof indexedDB === 'undefined')
    return Promise.reject(new Error('IndexedDB no está disponible'));
  return storage.updatePair(...args);
}
