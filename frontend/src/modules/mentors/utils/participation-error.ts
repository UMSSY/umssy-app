import { isApiError } from "@/shared/services/api-client";
import { BusinessRecordStorageError } from "@/shared/services/storage/business-record-storage-error";

export function participationErrorCode(error: unknown): string | undefined {
  if (!isApiError(error)) return;
  return error.response?.data?.data?.code;
}

export function participationErrorMessage(error: unknown): string {
  if (error instanceof BusinessRecordStorageError) return error.message;
  if (isApiError(error)) {
    if (error.response?.status === 429) return "Tu capacidad para solicitar participación como mentor ha sido suspendida temporalmente. Recibirás más información en tu correo institucional.";
    if (error.response?.status === 401) return "Tu sesión ha caducado. Inicia sesión nuevamente.";
    if (error.response?.status === 403) return "No tienes autorización para realizar esta operación.";
    if (error.response?.status === 404) return "La solicitud ya no existe o no está disponible.";
    const body = error.response?.data;
    if (typeof body?.detail === "string") return body.detail;
    if (typeof body?.message === "string") return body.message;
    if (error.response?.status === 409) return "La solicitud cambió de estado. Actualiza la página.";
  }
  return "No se pudo completar la operación. Comprueba tu conexión e intenta nuevamente.";
}
