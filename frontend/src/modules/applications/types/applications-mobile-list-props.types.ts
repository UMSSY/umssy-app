import type { Application } from "./application.types";

export interface ApplicationsMobileListProps {
  applications: readonly Application[];
  withdrawingId: string | null;
  onWithdraw: (applicationId: string) => void;
}
