import { getAccessToken } from "@/shared/services/storage/access-token-storage";

/**
 * Función centralizada para obtener el token de autenticación (JWT).
 * Mantiene compatibilidad con los módulos que leen el token directamente,
 * mientras el backend acepta autenticación por cookie y por cabecera Bearer.
 */
export function getAuthToken(): string | null {
  return getAccessToken();
}

export { getAccessToken };
