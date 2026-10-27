import { readIndexedDb, removeIndexedDb, writeIndexedDb, updateIndexedDb } from "./browser-indexed-db";

const memory = new Map<string, unknown>();
const operations = new Map<string, Promise<unknown>>();

// Serializa un registro; nunca mantiene el bloqueo durante HTTP.
export function updateBusinessRecord<T>(key: string, update: (current: T | null) => T | null): Promise<T | null> {
  const previous = operations.get(key) ?? Promise.resolve();
  const operation = previous.catch(() => {}).then(async () => {
    try {
      const next = await updateIndexedDb<T>(key, update);
      if (next === null) memory.delete(key); else memory.set(key, next);
      return next;
    } catch { /* Conserva el respaldo si el navegador no permite una transacción. */ }
    let current = (memory.get(key) as T | undefined) ?? null;
    try { current = await readIndexedDb<T>(key) ?? current; } catch { /* Conserva el respaldo si IndexedDB falla. */ }
    const next = update(current);
    if (next === null) memory.delete(key); else memory.set(key, next);
    try {
      if (next === null) await removeIndexedDb(key); else await writeIndexedDb(key, next);
    } catch { /* La memoria conserva la intención cuando falla el almacenamiento. */ }
    return next;
  });
  operations.set(key, operation);
  const cleanup = () => { if (operations.get(key) === operation) operations.delete(key); };
  void operation.then(cleanup, cleanup);
  return operation;
}
