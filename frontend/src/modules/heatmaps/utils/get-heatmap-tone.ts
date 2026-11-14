import { HEATMAP_EMPTY_TONE, HEATMAP_TONE_SCALE } from "../constants/heatmap-text.constants";
import type { HeatmapCell } from "../types/heatmap.types";

export function getHeatmapTone(cell?: HeatmapCell): string {
  if (!cell || cell.isEmpty || cell.percentage === undefined) return HEATMAP_EMPTY_TONE;
  const percentage = Math.min(Math.max(cell.percentage, 0), 100);
  return (HEATMAP_TONE_SCALE.find((tone) => percentage <= tone.max) ?? HEATMAP_TONE_SCALE[HEATMAP_TONE_SCALE.length - 1]).className;
}
