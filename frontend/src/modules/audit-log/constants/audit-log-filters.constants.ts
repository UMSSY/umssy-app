import type { AuditAction } from "../types/audit-event.types";
import { AUDIT_ACTION_STYLES } from "./audit-actions.constants";

export const SEARCH_DEBOUNCE_MS = 300;
export const MIN_SEARCH_LENGTH = 2;

// Valor de los selectores que significa "sin filtro"
export const ALL_VALUE = "all";

export const ACTION_OPTIONS: ReadonlyArray<{ value: AuditAction | typeof ALL_VALUE; label: string }> = [
  { value: ALL_VALUE, label: "Todas" },
  ...(Object.entries(AUDIT_ACTION_STYLES) as [AuditAction, { label: string }][]).map(([value, style]) => ({ value, label: style.label })),
];

export const INVALID_PERIOD_MESSAGE = "La fecha final no puede ser anterior a la fecha inicial.";

export const CSV_FALLBACK_FILE_NAME = "registro-auditoria.csv";
