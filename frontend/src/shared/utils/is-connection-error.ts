import axios from "axios";

// Fallo de conexión: la petición no obtuvo respuesta (red caída) o el servidor respondió 503/504.
export function isConnectionError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;

  return error.response.status === 503 || error.response.status === 504;
}