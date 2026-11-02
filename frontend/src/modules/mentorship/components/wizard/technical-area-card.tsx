"use client";

import { createElement } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveTechnicalAreaIcon } from "../../utils/technical-area-icon";
import type { TechnicalAreaResponse } from "../../types/technical-area-response.types";

type TechnicalAreaCardProps = {
  area: TechnicalAreaResponse;
  isSelected: boolean;
  onToggle: (id: string) => void;
};

export function TechnicalAreaCard({
  area,
  isSelected,
  onToggle,
}: TechnicalAreaCardProps) {
  return (
    <Button
      type="button"
      onClick={() => onToggle(area.id)}
      className={cn("flex w-full flex-col items-start gap-3 rounded-lg border p-4 text-left transition-colors", isSelected ? "border-accent bg-interaction" : "border-border bg-surface hover:border-border-strong")}
      aria-pressed={isSelected}
    >
      <div className="flex w-full items-start justify-between">
        <div
          className={cn("flex size-10 items-center justify-center rounded-md", isSelected ? "bg-accent text-white" : "bg-surface text-text-secondary")}
        >
          {createElement(resolveTechnicalAreaIcon(area.name), { className: "size-5", "aria-hidden": true })}
        </div>

        <div
          className={cn("flex size-5 items-center justify-center rounded border", isSelected ? "border-accent bg-accent text-white" : "border-border bg-surface")}
        >
          {isSelected && (
            <CheckCircle className="size-3.5" strokeWidth={3} aria-hidden />
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink">{area.name}</h3>
        <p className="mt-1 text-xs text-text-secondary">{area.description}</p>
      </div>
    </Button>
  );
}
