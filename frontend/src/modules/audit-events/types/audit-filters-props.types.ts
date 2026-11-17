import type { AuditResponsibleOption } from "./audit-responsible-option.types";
import type { AuditFilterValues } from "./audit-filter-values.types";
import type { AuditFilterHandlers } from "./audit-filter-handlers.types";

export interface AuditFiltersProps extends AuditFilterHandlers {
  values: AuditFilterValues;
  responsibles: AuditResponsibleOption[];
  activeCount: number;
  periodError: string | null;
}
