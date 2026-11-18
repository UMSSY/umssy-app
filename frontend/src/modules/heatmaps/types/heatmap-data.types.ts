import type { HeatmapColumn } from "./heatmap-column.types";
import type { HeatmapExtraColumnConfig } from "./heatmap-extra-column-config.types";
import type { HeatmapRow } from "./heatmap-row.types";
import type { HeatmapType } from "./heatmap-type.types";

export interface HeatmapData {
  heatmapType: HeatmapType;
  baseCount: number;
  baseLabel: string;
  columns: HeatmapColumn[];
  extraColumnsConfig?: HeatmapExtraColumnConfig[];
  rows: HeatmapRow[];
  quickReadSummary?: string;
}
