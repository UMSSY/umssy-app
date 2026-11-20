const SESSION_USER_ID_STORAGE_KEY = "umssy_current_user_id";

let inMemoryUserId: string | null = null;

/**
 * Guarda el ID de usuario de la sesión activa en memoria y en sessionStorage.
 * El ID de usuario no es confidencial y permite conservar la identidad
 * ante recargas de página (F5) para servicios como la idempotencia de intenciones.
 */
export function setCurrentSessionUserId(userId: string | null): void {
  inMemoryUserId = userId;
  if (typeof window !== "undefined") {
    try {
      if (userId) {
        sessionStorage.setItem(SESSION_USER_ID_STORAGE_KEY, userId);
      } else {
        sessionStorage.removeItem(SESSION_USER_ID_STORAGE_KEY);
      }
    } catch {
      // Ignorar errores de acceso a sessionStorage
    }
  }
}

/**
 * Retorna el ID de usuario de la sesión actual:
 * 1. Desde memoria si está disponible.
 * 2. Desde sessionStorage tras una recarga de módulo o página.
 * 3. Null si no hay identidad activa.
 */
export function getCurrentSessionUserId(): string | null {
  if (inMemoryUserId) return inMemoryUserId;
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(SESSION_USER_ID_STORAGE_KEY);
      if (stored) {
        inMemoryUserId = stored;
        return stored;
      }
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Limpia el ID de usuario en memoria y en sessionStorage.
 */
export function clearCurrentSessionUserId(): void {
  setCurrentSessionUserId(null);
}
