import type { HeatmapType } from "./heatmap.types";

export type HeatmapCellFormat = "count-first" | "percentage-first";

export interface HeatmapViewConfig {
  type: HeatmapType;
  path: string;
  navLabel: string;
  title: string;
  subtitle: string;
  cellFormat: HeatmapCellFormat;
  cellUnit: string;
  showCareerFilter: boolean;
  showPromotionFilter: boolean;
  showMonthFilter: boolean;
  emptyMessage: string;
}
