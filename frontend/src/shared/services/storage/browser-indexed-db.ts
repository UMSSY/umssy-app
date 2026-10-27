const DATABASE_NAME = "umssy-business-data";
const STORE_NAME = "drafts";

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB no está disponible"));
  return new Promise((resolve, reject) => {
    let blocked = false;
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onblocked = () => {
      blocked = true;
      reject(new Error("Cierra las otras pestañas de UMSSY para habilitar el almacenamiento persistente"));
    };
    request.onsuccess = () => {
      if (blocked) {
        request.result.close();
        return;
      }
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function readIndexedDb<T>(key: string): Promise<T | null> {
  const database = await openDatabase();
  try {
    return await new Promise<T | null>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(key);
      transaction.oncomplete = () => resolve((request.result as T | undefined) ?? null);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error("La lectura de IndexedDB se canceló"));
    });
  } finally {
    database.close();
  }
}

export async function writeIndexedDb<T>(key: string, value: T): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite", { durability: "strict" });
      transaction.objectStore(STORE_NAME).put(value, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error("La escritura de IndexedDB se canceló"));
    });
  } finally {
    database.close();
  }
}

export async function removeIndexedDb(key: string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite", { durability: "strict" });
      transaction.objectStore(STORE_NAME).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error("La eliminación de IndexedDB se canceló"));
    });
  } finally {
    database.close();
  }
}

export async function updateIndexedDb<T>(
  key: string,
  update: (current: T | null) => T | null,
): Promise<T | null> {
  const database = await openDatabase();
  try {
    return await new Promise<T | null>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite", { durability: "strict" });
      const store = transaction.objectStore(STORE_NAME);
      let next: T | null = null;

      transaction.oncomplete = () => resolve(next);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error("La actualización de IndexedDB se canceló"));

      const request = store.get(key);
      request.onsuccess = () => {
        try {
          next = update((request.result as T | undefined) ?? null);
          if (next === null) store.delete(key);
          else store.put(next, key);
        } catch (error) {
          transaction.abort();
          reject(error);
        }
      };
    });
  } finally {
    database.close();
  }
}
