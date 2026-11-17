import type { ApplicationStatusFilter } from "./application-status-filter.types";

export interface ApplicationsStatusSelectProps {
  value: ApplicationStatusFilter;
  onValueChange: (value: ApplicationStatusFilter) => void;
  showWithdrawn: boolean;
}
