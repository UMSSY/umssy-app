import { updateIndexedDb } from "./browser-indexed-db";

// La transacción serializa también otras pestañas. Si falla la persistencia,
// se detiene el envío para conservar la identidad del próximo reintento.
export function updateBusinessRecord<T>(
  key: string,
  update: (current: T | null) => T | null,
): Promise<T | null> {
  return updateIndexedDb(key, update);
}
