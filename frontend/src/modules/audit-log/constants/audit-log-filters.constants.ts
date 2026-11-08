import type { AuditAction } from "../types/audit-event.types";
import { AUDIT_ACTION_STYLES } from "./audit-actions.constants";

// Valor de los selectores que significa "sin filtro"
export const ALL_VALUE = "all";

export const ACTION_OPTIONS: ReadonlyArray<{ value: AuditAction | typeof ALL_VALUE; label: string }> = [
  { value: ALL_VALUE, label: "Todas" },
  ...(Object.entries(AUDIT_ACTION_STYLES) as [AuditAction, { label: string }][]).map(([value, style]) => ({ value, label: style.label })),
];
