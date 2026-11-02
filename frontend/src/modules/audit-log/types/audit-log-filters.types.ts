import type { AuditAction } from "./audit-event.types";

// Filtros que se envían al servidor; un texto vacío significa "sin filtro"
export interface AuditLogFilters {
  search: string;
  action: AuditAction | "";
  responsibleId: string;
  from: string;
  to: string;
}
