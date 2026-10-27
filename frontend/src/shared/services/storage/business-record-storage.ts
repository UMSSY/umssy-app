import { updateIndexedDb } from "./browser-indexed-db";
import { BusinessRecordStorageError } from "./business-record-storage-error";

const operations = new Map<string, Promise<unknown>>();

export function updateBusinessRecord<T>(key: string, update: (current: T | null) => T | null): Promise<T | null> {
  const previous = operations.get(key) ?? Promise.resolve();
  const persist = async () => {
    try {
      return await updateIndexedDb<T>(key, update);
    } catch (cause) {
      throw new BusinessRecordStorageError(cause);
    }
  };
  const operation = previous.then(persist, persist);
  operations.set(key, operation);
  const cleanup = () => { if (operations.get(key) === operation) operations.delete(key); };
  void operation.then(cleanup, cleanup);
  return operation;
}
