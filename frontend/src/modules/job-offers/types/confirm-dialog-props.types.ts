import type { ComponentProps, ReactNode } from "react";
import type { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  busyLabel?: string;
  isBusy?: boolean;
  confirmVariant?: ComponentProps<typeof Button>["variant"];
  onConfirm: () => void;
  onCancel?: () => void;
}
