import type { Application } from "./application.types";

export interface ReactivateApplicationDialogProps {
  application: Application | null;
  isPending: boolean;
  hasError: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}
