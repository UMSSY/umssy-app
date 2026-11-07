import type { Application } from "./application.types";

export interface WithdrawApplicationDialogProps {
  application: Application | null;
  onCancel: () => void;
  onConfirm: (applicationId: string) => void;
}
