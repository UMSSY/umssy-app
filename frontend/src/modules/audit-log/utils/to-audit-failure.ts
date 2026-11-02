export const NETWORK_ERROR_MESSAGE = "No se pudo conectar con el servidor. Inténtalo de nuevo.";
export const GENERIC_ERROR_MESSAGE = "No se pudo completar la operación. Inténtalo de nuevo.";
export const SESSION_EXPIRED_MESSAGE = "Tu sesión expiró. Inicia sesión de nuevo.";
export const FORBIDDEN_MESSAGE = "No tienes permiso para ver el registro de auditoría.";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Mismos mensajes que el resto del backoffice para sesión vencida y acceso denegado
export function toAuditFailure(status: number, body: unknown): { ok: false; status: number; message: string } {
  if (status === 401) return { ok: false, status, message: SESSION_EXPIRED_MESSAGE };
  if (status === 403) return { ok: false, status, message: FORBIDDEN_MESSAGE };
  const firstError = isRecord(body) && Array.isArray(body.errors) && isRecord(body.errors[0]) ? body.errors[0].message : undefined;
  if (typeof firstError === "string") return { ok: false, status, message: firstError };
  if (isRecord(body) && typeof body.detail === "string") return { ok: false, status, message: body.detail };
  return { ok: false, status, message: GENERIC_ERROR_MESSAGE };
}
