import type { Application } from "./application.types";

export interface ApplicationsMobileListProps {
  applications: readonly Application[];
  withdrawingId: string | null;
  onWithdraw: (applicationId: string) => void;
  contactingId: string | null;
  onContact: (application: Application) => void;
  onReactivate?: (applicationId: string) => void;
  reactivatingId?: string | null;
}
