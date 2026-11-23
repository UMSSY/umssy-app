import type { AuditApiResult } from "../types/audit-api-result.types";

// Conserva el código HTTP para que la vista distinga sesión vencida, permiso y fallo de conexión
export class AuditRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AuditRequestError";
  }
}

export function unwrapAuditResult<T>(result: AuditApiResult<T>): T {
  if (!result.ok) throw new AuditRequestError(result.message, result.status);
  return result.data;
}
