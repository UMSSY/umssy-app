import type { HeatmapColumn } from './heatmap-column.types.js';
import type { HeatmapExtraColumnConfig } from './heatmap-extra-column-config.types.js';
import type { HeatmapRow } from './heatmap-row.types.js';
import type { HeatmapType } from './heatmap-type.types.js';

export interface HeatmapResponse {
  heatmapType: HeatmapType;
  baseCount: number;
  baseLabel: string;
  columns: HeatmapColumn[];
  extraColumnsConfig?: HeatmapExtraColumnConfig[];
  rows: HeatmapRow[];
  quickReadSummary?: string;
}
