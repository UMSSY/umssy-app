import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { IndexedDbStorageOptions } from '@/shared/types/indexed-db-storage-options.types';

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
    readPair(
      primaryKey: string,
      secondaryKey: string,
    ): Promise<[unknown, unknown]> {
      return withDatabase(async (database) => {
        const transaction = database.transaction(storeName, 'readonly');
        const [primary, secondary] = await Promise.all([
          transaction.store.get(primaryKey),
          transaction.store.get(secondaryKey),
          transaction.done,
        ]);
        return [primary, secondary];
      });
    },
    updatePair(
      primaryKey: string,
      secondary: string | ((primary: unknown) => string),
      update: (
        primary: unknown,
        secondary: unknown,
      ) => {
        primary?: string | null;
        secondary?: unknown;
      },
    ): Promise<void> {
      return withDatabase(async (database) => {
        const transaction = database.transaction(storeName, 'readwrite');
        try {
          const primary = await transaction.store.get(primaryKey);
          const secondaryKey =
            typeof secondary === 'string' ? secondary : secondary(primary);
          const next = update(
            primary,
            await transaction.store.get(secondaryKey),
          );
          for (const [key, value] of [
            [primaryKey, next.primary],
            [secondaryKey, next.secondary],
          ] as const) {
            if (value === null) await transaction.store.delete(key);
            else if (value !== undefined)
              await transaction.store.put(value, key);
          }
          await transaction.done;
        } catch (error) {
          try {
            transaction.abort();
          } catch {
            // The transaction may already be closed.
          }
          await transaction.done.catch(() => {});
          throw error;
        }
      });
    },
    read(key: IDBValidKey): Promise<unknown> {
      return withDatabase(async (database) => {
        const transaction = database.transaction(storeName, 'readonly');
        const [value] = await Promise.all([
          transaction.store.get(key),
          transaction.done,
        ]);
        return value;
      });
    },
    write(key: IDBValidKey, value: unknown): Promise<void> {
      return withDatabase(async (database) => {
        const transaction = database.transaction(storeName, 'readwrite');
        await Promise.all([
          transaction.store.put(value, key),
          transaction.done,
        ]);
      });
    },
    remove(key: IDBValidKey): Promise<void> {
      return withDatabase(async (database) => {
        const transaction = database.transaction(storeName, 'readwrite');
        await Promise.all([transaction.store.delete(key), transaction.done]);
      });
    },
    update<T>(
      key: IDBValidKey,
      update: (current: T | null) => T | null,
    ): Promise<T | null> {
      return withDatabase(async (database) => {
        // Lectura y escritura comparten transacción, también entre pestañas.
        const transaction = database.transaction(storeName, 'readwrite');
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
    readByPrefix(prefix: string): Promise<Array<{ key: string; value: unknown }>> {
      return withDatabase(async (database) => {
        const transaction = database.transaction(storeName, "readonly");
        const [keys, values] = await Promise.all([transaction.store.getAllKeys(), transaction.store.getAll(), transaction.done]);
        return keys.reduce<Array<{ key: string; value: unknown }>>((result, key, index) => {
          if (typeof key === "string" && key.startsWith(prefix)) result.push({ key, value: values[index] });
          return result;
        }, []);
      });
    },
    removeByPrefix(prefix: string): Promise<void> {
      return withDatabase(async (database) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const keys = await transaction.store.getAllKeys();
        const matchingKeys = keys.filter(
          (key) => typeof key === 'string' && key.startsWith(prefix),
        );
        await Promise.all([
          ...matchingKeys.map((key) => transaction.store.delete(key)),
          transaction.done,
        ]);
      });
    },
  };
}
