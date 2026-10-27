import { openDB } from "idb";

const DATABASE_NAME = "umssy-business-data";
const STORE_NAME = "drafts";

async function openDatabase() {
  if (typeof indexedDB === "undefined") return null;
  return openDB(DATABASE_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
    },
  });
}

export async function readIndexedDb<T>(key: string): Promise<T | null> {
  const database = await openDatabase();
  if (!database) return null;
  try { return (await database.get(STORE_NAME, key) as T | undefined) ?? null; }
  finally { database.close(); }
}

export async function writeIndexedDb<T>(key: string, value: T): Promise<void> {
  const database = await openDatabase();
  if (!database) throw new Error("IndexedDB no está disponible");
  try { await database.put(STORE_NAME, value, key); }
  finally { database.close(); }
}

export async function removeIndexedDb(key: string): Promise<void> {
  const database = await openDatabase();
  if (!database) return;
  try { await database.delete(STORE_NAME, key); }
  finally { database.close(); }
}

export async function updateIndexedDb<T>(key: string, update: (current: T | null) => T | null): Promise<T | null> {
  const database = await openDatabase();
  if (!database) throw new Error("IndexedDB no está disponible");
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const current = (await transaction.store.get(key) as T | undefined) ?? null;
    const next = update(current);
    if (next === null) await transaction.store.delete(key); else await transaction.store.put(next, key);
    await transaction.done;
    return next;
  } finally { database.close(); }
}
