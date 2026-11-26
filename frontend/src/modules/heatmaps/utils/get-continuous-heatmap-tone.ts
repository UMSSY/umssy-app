import { HEATMAP_CONTINUOUS_TONE, HEATMAP_EMPTY_TONE } from "../constants/heatmap-text.constants";
import type { HeatmapCell } from "../types/heatmap-cell.types";
import type { HeatmapContinuousTone } from "../types/heatmap-continuous-tone.types";

export function getContinuousHeatmapTone(cell?: HeatmapCell): HeatmapContinuousTone {
  if (!cell || cell.isEmpty || cell.percentage === undefined) return { className: HEATMAP_EMPTY_TONE };
  const percentage = Math.min(Math.max(cell.percentage, 0), 100);
  const alpha = Math.max(HEATMAP_CONTINUOUS_TONE.minAlpha, Math.round(percentage));
  return {
    className: percentage >= HEATMAP_CONTINUOUS_TONE.darkTextFrom ? HEATMAP_CONTINUOUS_TONE.darkText : HEATMAP_CONTINUOUS_TONE.lightText,
    style: { backgroundColor: `color-mix(in srgb, var(--primary) ${alpha}%, white)` },
  };
}
