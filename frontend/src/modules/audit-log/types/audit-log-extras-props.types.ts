import type { AuditResponsibleOption } from "./audit-log-records.types";
import type { AuditAction } from "./audit-event.types";

export interface AuditFilterValues {
  searchInput: string;
  action: AuditAction | "";
  responsibleId: string;
  from: string;
  to: string;
}

export interface AuditFilterHandlers {
  onSearchChange: (value: string) => void;
  onActionChange: (value: AuditAction | "") => void;
  onResponsibleChange: (value: string) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onClear: () => void;
}

export interface AuditFiltersProps extends AuditFilterHandlers {
  values: AuditFilterValues;
  responsibles: AuditResponsibleOption[];
  activeCount: number;
  periodError: string | null;
}

export interface AuditFilterFieldsProps extends Omit<AuditFiltersProps, "onSearchChange" | "activeCount" | "onClear"> {
  idPrefix: string;
}

export interface AuditSearchInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

export interface ExportCsvButtonProps {
  total: number;
  isExporting: boolean;
  disabled?: boolean;
  onExport: () => void;
}
