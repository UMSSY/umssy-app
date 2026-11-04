import type { ComponentProps, ReactNode } from "react";
import type { Button } from "@/components/ui/button";

export interface StepActionsProps {
  secondaryLabel: string;
  primaryLabel: ReactNode;
  primaryVariant?: ComponentProps<typeof Button>["variant"];
  showPreviousIcon?: boolean;
  onSecondary: () => void;
  onPrimary: () => void;
  isBusy?: boolean;
  className?: string;
}
