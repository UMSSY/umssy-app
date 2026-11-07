import type { Application } from "./application.types";
import type { ApplicationSort, ApplicationSortKey, ApplicationStatusFilter } from "./application-list.types";

export interface ApplicationsTableProps {
  applications: readonly Application[];
  withdrawingId: string | null;
  onWithdraw: (applicationId: string) => void;
  sort?: ApplicationSort | null;
  onSortChange?: (key: ApplicationSortKey) => void;
}

export interface ApplicationsMobileListProps {
  applications: readonly Application[];
  withdrawingId: string | null;
  onWithdraw: (applicationId: string) => void;
}

export interface ApplicationsStatusTabsProps {
  value: ApplicationStatusFilter;
  onValueChange: (value: ApplicationStatusFilter) => void;
}

export interface WithdrawApplicationDialogProps {
  application: Application | null;
  onCancel: () => void;
  onConfirm: (applicationId: string) => void;
}
