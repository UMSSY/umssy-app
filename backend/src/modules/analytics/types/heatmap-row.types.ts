import type { HeatmapCell } from './heatmap-cell.types.js';
import type { HeatmapExtraValue } from './heatmap-extra-value.types.js';

export interface HeatmapRow {
  skillId: string;
  skillName: string;
  cells: HeatmapCell[];
  extraValues?: Record<string, HeatmapExtraValue>;
}
