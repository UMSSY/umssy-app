import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StepActionsProps } from "../types/step-actions-props.types";

const ACTION_BUTTON_CLASSES = "group h-auto px-6 py-2.5 text-sm font-semibold max-md:min-h-11";

export function StepActions({
  secondaryLabel,
  primaryLabel,
  primaryVariant = "default",
  showPreviousIcon = false,
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
        className={cn(ACTION_BUTTON_CLASSES, "text-ink")}
      >
        {showPreviousIcon ? (
          <ArrowLeft
            aria-hidden="true"
            className="transition-transform duration-150 group-hover:-translate-x-0.5"
          />
        ) : null}
        {secondaryLabel}
      </Button>
      <Button
        type="button"
        variant={primaryVariant}
        onClick={onPrimary}
        disabled={isBusy}
        aria-busy={isBusy}
        className={ACTION_BUTTON_CLASSES}
      >
        {isBusy ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
        {primaryLabel}
        {!isBusy ? (
          <ArrowRight
            aria-hidden="true"
            className="transition-transform duration-150 group-hover:translate-x-0.5"
          />
        ) : null}
      </Button>
    </div>
  );
}
