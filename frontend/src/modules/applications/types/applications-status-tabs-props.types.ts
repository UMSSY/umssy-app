import type { ApplicationStatusFilter } from "./application-status-filter.types";

export interface ApplicationsStatusTabsProps {
  value: ApplicationStatusFilter;
  onValueChange: (value: ApplicationStatusFilter) => void;
  showWithdrawn?: boolean;
}
