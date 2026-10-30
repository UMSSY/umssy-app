import { openDB } from "idb";
import type { IDBPDatabase } from "idb";
import type { IndexedDbStorageOptions } from "@/shared/types/indexed-db-storage-options.types";

export function createIndexedDbStorage({
  databaseName,
  storeName,
  version = 1,
}: IndexedDbStorageOptions) {
  async function withDatabase<T>(
    operation: (database: IDBPDatabase) => Promise<T>,
  ): Promise<T> {
    const database = await openDB(databaseName, version, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName))
          db.createObjectStore(storeName);
      },
    });
    try {
      return await operation(database);
    } finally {
      database.close();
    }
  }

  return {
    read(key: IDBValidKey): Promise<unknown> {
      return withDatabase(async (database) => {
        const transaction = database.transaction(storeName, "readonly");
        const [value] = await Promise.all([
          transaction.store.get(key),
          transaction.done,
        ]);
        return value;
      });
    },
    write(key: IDBValidKey, value: unknown): Promise<void> {
      return withDatabase(async (database) => {
        const transaction = database.transaction(storeName, "readwrite");
        await Promise.all([
          transaction.store.put(value, key),
          transaction.done,
        ]);
      });
    },
    remove(key: IDBValidKey): Promise<void> {
      return withDatabase(async (database) => {
        const transaction = database.transaction(storeName, "readwrite");
        await Promise.all([transaction.store.delete(key), transaction.done]);
      });
    },
    update<T>(
      key: IDBValidKey,
      update: (current: T | null) => T | null,
    ): Promise<T | null> {
      return withDatabase(async (database) => {
        // Lectura y escritura comparten transacción, también entre pestañas.
        const transaction = database.transaction(storeName, "readwrite");
        try {
          const current = await transaction.store.get(key);
          const next = update((current as T | undefined) ?? null);
          if (next === null) await transaction.store.delete(key);
          else await transaction.store.put(next, key);
          await transaction.done;
          return next;
        } catch (error) {
          try {
            transaction.abort();
          } catch {
            /* La transacción puede estar cancelada. */
          }
          await transaction.done.catch(() => {});
          throw error;
        }
      });
    },
  };
}
