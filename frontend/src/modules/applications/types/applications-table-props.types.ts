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
  showWithdrawn?: boolean;
}

export interface WithdrawApplicationDialogProps {
  application: Application | null;
  onCancel: () => void;
  onConfirm: (applicationId: string) => void;
}

export interface WithdrawApplicationButtonProps {
  application: Application;
  withdrawingId: string | null;
  onWithdraw: (applicationId: string) => void;
  className?: string;
}

export interface ShowWithdrawnSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  count: number;
}
