import type { Application } from "./application.types";

export interface ApplicationsTableProps {
  applications: readonly Application[];
  withdrawingId: string | null;
  onWithdraw: (applicationId: string) => void;
}
