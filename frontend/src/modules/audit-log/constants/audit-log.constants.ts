import type { AuditLogFilters } from "../types/audit-log-filters.types";

export const AUDIT_PAGE_SIZE = 10;

export const AUDIT_PAGE_TITLE = "Registro de auditoría";
export const AUDIT_PAGE_DESCRIPTION = "Historial de cada solicitud: quién hizo cada acción, cuándo y con qué documento.";

export const BOLIVIA_TIME_ZONE = "America/La_Paz";
export const BOLIVIA_TIME_LABEL = "hora de Bolivia (UTC-4)";

export const EMPTY_VALUE = "Sin dato";
export const NO_EVIDENCE_LABEL = "Sin documento";

// Paginación numerada: cuántos botones caben y el bloque que se muestra junto a un extremo
export const MAX_VISIBLE_PAGES = 7;
export const EDGE_PAGE_BLOCK = 5;

export const DEFAULT_AUDIT_FILTERS: AuditLogFilters = {
  search: "",
  action: "",
  responsibleId: "",
  from: "",
  to: "",
};
