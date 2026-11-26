import type { AuditAction } from "./audit-action.types";

export interface AuditFilterHandlers {
  onSearchChange: (value: string) => void;
  onActionChange: (value: AuditAction | "") => void;
  onResponsibleChange: (value: string) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onClear: () => void;
}
