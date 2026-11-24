export const LAST_ACTIVITY_STORAGE_KEY = "umssy_last_activity_timestamp";

export function recordSessionActivity(at: number = Date.now()): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(at));
  } catch {
    // El almacenamiento puede estar bloqueado; la pestaña sigue midiendo su propia actividad
  }
}

export function readSessionActivity(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}
