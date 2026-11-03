import type { InboxPeriod } from "./inbox-filters.types";

export interface InboxFiltersProps {
  search: string;
  career: string;
  period: InboxPeriod;
  validation: string;
  onSearchChange: (value: string) => void;
  onCareerChange: (value: string) => void;
  onPeriodChange: (value: InboxPeriod) => void;
  onValidationChange: (value: string) => void;
}
