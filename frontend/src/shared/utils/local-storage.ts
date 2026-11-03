function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readLocalStorage<T>(key: string): T | null {
  const rawValue = getStorage()?.getItem(key);
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

export function writeLocalStorage<T>(key: string, value: T): void {
  try {
    getStorage()?.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

export function removeLocalStorage(key: string): void {
  try {
    getStorage()?.removeItem(key);
  } catch {
    return;
  }
}
