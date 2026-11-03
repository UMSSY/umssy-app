import { readLocalStorage, removeLocalStorage, writeLocalStorage } from "@/shared/services/storage/browser-local-storage";

export function readSurveyStorage<T>(key: string): T | null {
  const rawValue = readLocalStorage(key);
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

export function writeSurveyStorage<T>(key: string, value: T): void {
  writeLocalStorage(key, JSON.stringify(value));
}

export function removeSurveyStorage(key: string): void {
  removeLocalStorage(key);
}
