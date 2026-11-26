import type { AuditFiltersProps } from "./audit-filters-props.types";

export interface AuditFilterFieldsProps extends Omit<
  AuditFiltersProps,
  "onSearchChange" | "activeCount" | "onClear"
> {
  idPrefix: string;
}
