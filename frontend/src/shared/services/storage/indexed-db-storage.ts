import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { IndexedDbStorageOptions } from '@/shared/types/indexed-db-storage-options.types';

export function createIndexedDbStorage({ databaseName, storeName, version = 1 }: IndexedDbStorageOptions) {
  async function withDatabase<T>(operation: (database: IDBPDatabase) => Promise<T>): Promise<T> {
    const database = await openDB(databaseName, version, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName);
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
        const transaction = database.transaction(storeName, 'readonly');
        const [value] = await Promise.all([transaction.store.get(key), transaction.done]);
        return value;
      });
    },
    write(key: IDBValidKey, value: unknown): Promise<void> {
      return withDatabase(async (database) => {
        const transaction = database.transaction(storeName, 'readwrite');
        await Promise.all([transaction.store.put(value, key), transaction.done]);
      });
    },
    remove(key: IDBValidKey): Promise<void> {
      return withDatabase(async (database) => {
        const transaction = database.transaction(storeName, 'readwrite');
        await Promise.all([transaction.store.delete(key), transaction.done]);
      });
    },
  };
}
