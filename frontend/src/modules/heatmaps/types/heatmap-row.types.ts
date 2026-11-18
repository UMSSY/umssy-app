import type { HeatmapCell } from "./heatmap-cell.types";
import type { HeatmapExtraValue } from "./heatmap-extra-value.types";

export interface HeatmapRow {
  skillId: string;
  skillName: string;
  cells: HeatmapCell[];
  extraValues?: Record<string, HeatmapExtraValue>;
}
