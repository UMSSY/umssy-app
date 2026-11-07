import type { Application } from "./application.types";
import type { ApplicationSort } from "./application-sort.types";
import type { ApplicationSortKey } from "./application-sort-key.types";

export interface ApplicationsTableProps {
  applications: readonly Application[];
  withdrawingId: string | null;
  onWithdraw: (applicationId: string) => void;
  sort?: ApplicationSort | null;
  onSortChange?: (key: ApplicationSortKey) => void;
}
