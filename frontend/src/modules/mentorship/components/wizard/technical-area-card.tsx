"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Server } from "lucide-react";
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
      className={[
        "flex w-full flex-col items-start gap-3 rounded-lg border p-4 text-left transition-colors",
        isSelected
          ? "border-accent bg-interaction"
          : "border-border bg-surface hover:border-slate-300",
      ].join(" ")}
      aria-pressed={isSelected}
    >
      <div className="flex w-full items-start justify-between">
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-md",
            isSelected ? "bg-accent text-white" : "bg-white text-text-secondary",
          ].join(" ")}
        >
          <Server className="size-5" aria-hidden />
        </div>

        <div
          className={[
            "flex h-5 w-5 items-center justify-center rounded border",
            isSelected
              ? "border-accent bg-accent text-white"
              : "border-slate-300 bg-white",
          ].join(" ")}
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
