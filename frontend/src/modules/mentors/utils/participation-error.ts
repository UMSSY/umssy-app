import { isApiError } from "@/shared/services/api-client";

export function participationErrorCode(error: unknown): string | undefined {
  if (!isApiError(error)) return;
  return error.response?.data?.data?.code;
}

export function participationErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.response?.status === 429) return "Tu capacidad para solicitar participación como mentor ha sido suspendida temporalmente. Recibirás más información en tu correo institucional.";
    if (error.response?.status === 401) return "Tu sesión ha caducado. Inicia sesión nuevamente.";
    const body = error.response?.data;
    if (typeof body?.detail === "string") return body.detail;
    if (typeof body?.message === "string") return body.message;
  }
  return "No se pudo completar la operación. Comprueba tu conexión e intenta nuevamente.";
}
