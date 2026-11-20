import type { HeatmapCellFormat } from "./heatmap-cell-format.types";
import type { HeatmapLegendVariant } from "./heatmap-legend-variant.types";
import type { HeatmapToneMode } from "./heatmap-tone-mode.types";
import type { HeatmapTooltipVariant } from "./heatmap-tooltip-variant.types";
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
  careerAllLabel?: string;
  yearLabel?: string;
  baseHelp?: string;
  cellHint?: string;
  legendVariant?: HeatmapLegendVariant;
  toneMode?: HeatmapToneMode;
  tooltipVariant?: HeatmapTooltipVariant;
  percentageDecimals?: number;
}
