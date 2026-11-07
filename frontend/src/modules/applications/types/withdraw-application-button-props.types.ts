import type { Application } from "./application.types";

export interface WithdrawApplicationButtonProps {
  application: Application;
  withdrawingId: string | null;
  onWithdraw: (applicationId: string) => void;
  className?: string;
}
