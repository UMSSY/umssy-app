import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepActionsProps {
  secondaryLabel: string;
  primaryLabel: ReactNode;
  primaryVariant?: ComponentProps<typeof Button>["variant"];
  onSecondary: () => void;
  onPrimary: () => void;
  isBusy?: boolean;
  className?: string;
}

export function StepActions({
  secondaryLabel,
  primaryLabel,
  primaryVariant = "default",
  onSecondary,
  onPrimary,
  isBusy = false,
  className = "border-t border-border px-6 py-4",
}: StepActionsProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={onSecondary}
        disabled={isBusy}
        className="group h-auto px-6 py-2.5 text-sm font-semibold text-ink"
      >
        {secondaryLabel === "Anterior" ? <ArrowLeft aria-hidden="true" className="transition-transform duration-150 group-hover:-translate-x-0.5" /> : null}{secondaryLabel}
      </Button>
      <Button
        type="button"
        variant={primaryVariant}
        onClick={onPrimary}
        disabled={isBusy}
        aria-busy={isBusy}
        className="group h-auto px-6 py-2.5 text-sm font-semibold"
      >
        {primaryLabel}
        {!isBusy ? <ArrowRight aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5" /> : null}
      </Button>
    </div>
  );
}
