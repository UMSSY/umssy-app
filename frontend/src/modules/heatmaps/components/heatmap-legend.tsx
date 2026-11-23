import { cn } from "cn";
import { HEATMAP_TEXT, HEATMAP_TONE_SCALE } from "../constants/heatmap-text.constants";
import type { HeatmapLegendProps } from "../types/heatmap-legend-props.types";

export function HeatmapLegend({ variant = "steps" }: HeatmapLegendProps) {
  if (variant === "gradient") {
    return (
      <div className="flex items-center gap-2 text-xs text-text-secondary tabular-nums" aria-label="Leyenda del mapa de calor">
        <span>{HEATMAP_TEXT.legendMin}</span>
        <span
          className="h-2.5 w-40 rounded-full border border-border sm:w-56"
          style={{ backgroundImage: "linear-gradient(to right, color-mix(in srgb, var(--primary) 6%, white), var(--primary))" }}
          aria-hidden="true"
        />
        <span>{HEATMAP_TEXT.legendMax}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary" aria-label="Leyenda del mapa de calor">
      <span>{HEATMAP_TEXT.legendLow}</span>
      <ul className="flex items-center gap-1">
        {HEATMAP_TONE_SCALE.map((tone) => (
          <li key={tone.legend} className={cn("rounded px-2 py-1 font-medium tabular-nums", tone.className)}>
            {tone.legend}
          </li>
        ))}
      </ul>
      <span>{HEATMAP_TEXT.legendHigh}</span>
    </div>
  );
}
