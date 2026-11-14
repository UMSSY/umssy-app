import { cn } from "cn";
import { HEATMAP_TEXT, HEATMAP_TONE_SCALE } from "../constants/heatmap-text.constants";

export function HeatmapLegend() {
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