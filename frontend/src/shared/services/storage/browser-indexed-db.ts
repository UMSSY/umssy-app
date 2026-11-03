import { createIndexedDbStorage } from "./indexed-db-storage";

const storage = createIndexedDbStorage({
  databaseName: "umssy-business-data",
  storeName: "drafts",
});

export async function readIndexedDb<T>(key: string): Promise<T | null> {
  if (typeof indexedDB === "undefined") return null;
  return ((await storage.read(key)) as T | undefined) ?? null;
}

export function writeIndexedDb<T>(key: string, value: T): Promise<void> {
  if (typeof indexedDB === "undefined")
    return Promise.reject(new Error("IndexedDB no está disponible"));
  return storage.write(key, value);
}

export async function removeIndexedDb(key: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await storage.remove(key);
}

export function updateIndexedDb<T>(
  key: string,
  update: (current: T | null) => T | null,
): Promise<T | null> {
  if (typeof indexedDB === "undefined")
    return Promise.reject(new Error("IndexedDB no está disponible"));
  return storage.update(key, update);
}
