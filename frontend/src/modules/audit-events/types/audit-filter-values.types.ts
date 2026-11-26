import type { AuditAction } from "./audit-action.types";

export interface AuditFilterValues {
  searchInput: string;
  action: AuditAction | "";
  responsibleId: string;
  from: string;
  to: string;
}
