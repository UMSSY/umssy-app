import { Lightbulb } from "lucide-react";
import { HEATMAP_TEXT } from "../constants/heatmap-text.constants";
import type { HeatmapQuickReadProps } from "../types/heatmap-component-props.types";

export function HeatmapQuickRead({ summary }: HeatmapQuickReadProps) {
  return (
    <section aria-label={HEATMAP_TEXT.quickReadTitle} className="flex items-start gap-3 rounded-lg border border-primary/20 bg-interaction p-4">
      <Lightbulb className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
      <div>
        <h2 className="text-sm font-semibold text-ink">{HEATMAP_TEXT.quickReadTitle}</h2>
        <p className="mt-1 text-sm text-ink-soft">{summary?.trim() ? summary : HEATMAP_TEXT.noSummary}</p>
      </div>
    </section>
  );
}
