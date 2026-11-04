import { readIndexedDb, removeIndexedDb, writeIndexedDb } from "@/shared/services/storage/browser-indexed-db";

let pendingOperation: Promise<unknown> = Promise.resolve();

function enqueue<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  const next = pendingOperation.catch(() => undefined).then(operation).catch(() => fallback);
  pendingOperation = next;
  return next;
}

export function readSurveyStorage<T>(key: string): Promise<T | null> {
  return enqueue(() => readIndexedDb<T>(key), null);
}

export function writeSurveyStorage<T>(key: string, value: T): Promise<void> {
  return enqueue(() => writeIndexedDb(key, value), undefined);
}

export function removeSurveyStorage(key: string): Promise<void> {
  return enqueue(() => removeIndexedDb(key), undefined);
}
