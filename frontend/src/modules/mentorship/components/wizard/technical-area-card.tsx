"use client";

import { createElement } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveTechnicalAreaIcon } from "../../utils/technical-area-icon";
import type { TechnicalAreaCardProps } from "../../types/technical-area-card-props.types";

export function TechnicalAreaCard({
  area,
  isSelected,
  onToggle,
}: TechnicalAreaCardProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onToggle(area.id)}
      className={cn(
        "flex h-auto min-h-40 w-full min-w-0 flex-col items-stretch justify-start gap-3 self-stretch overflow-hidden rounded-lg border p-4 text-left whitespace-normal transition-colors",
        isSelected
          ? "border-accent bg-interaction hover:bg-interaction"
          : "border-border bg-surface hover:border-border-strong hover:bg-surface-soft",
      )}
      aria-pressed={isSelected}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div
          className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", isSelected ? "bg-accent text-accent-foreground" : "bg-surface text-text-secondary")}
        >
          {createElement(resolveTechnicalAreaIcon(area.name), { className: "size-5", "aria-hidden": true })}
        </div>

        <div
          className={cn("flex size-5 shrink-0 items-center justify-center rounded border", isSelected ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface")}
        >
          {isSelected && (
            <CheckCircle className="size-3.5" strokeWidth={3} aria-hidden />
          )}
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-semibold break-words text-ink">
          {area.name}
        </h3>
        <p className="mt-1 text-xs leading-relaxed font-normal break-words text-text-secondary">
          {area.description}
        </p>
      </div>
    </Button>
  );
}
