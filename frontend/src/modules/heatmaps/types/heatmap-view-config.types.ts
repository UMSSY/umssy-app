import type { HeatmapCellFormat } from "./heatmap-cell-format.types";
import type { HeatmapType } from "./heatmap-type.types";

export interface HeatmapViewConfig {
  type: HeatmapType;
  path: string;
  navLabel: string;
  title: string;
  subtitle: string;
  cellFormat: HeatmapCellFormat;
  cellUnit: string;
  showCareerFilter: boolean;
  showMonthFilter: boolean;
  emptyMessage: string;
}
