import type { AuditLogFilters } from "../types/audit-log-filters.types";

export const AUDIT_PAGE_SIZE = 10;


export const EMPTY_VALUE = "Sin dato";

// Paginación numerada: cuántos botones caben y el bloque que se muestra junto a un extremo

export const DEFAULT_AUDIT_FILTERS: AuditLogFilters = {
  search: "",
  action: "",
  responsibleId: "",
  from: "",
  to: "",
};
