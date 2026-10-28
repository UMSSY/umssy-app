import { updateIndexedDb } from "./browser-indexed-db";

// The read/write transaction also serializes competing tabs. If durable storage
// is unavailable, stop before HTTP rather than lose a key after a timeout.
export function updateBusinessRecord<T>(
  key: string,
  update: (current: T | null) => T | null,
): Promise<T | null> {
  return updateIndexedDb(key, update);
}
