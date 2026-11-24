import type { HeatmapCellFormat } from "./heatmap-cell-format.types";
import type { HeatmapColumn } from "./heatmap-column.types";
import type { HeatmapExtraColumnConfig } from "./heatmap-extra-column-config.types";
import type { HeatmapRow } from "./heatmap-row.types";
import type { HeatmapToneMode } from "./heatmap-tone-mode.types";
import type { HeatmapTooltipVariant } from "./heatmap-tooltip-variant.types";

export interface HeatmapMatrixProps {
  columns: HeatmapColumn[];
  rows: HeatmapRow[];
  extraColumnsConfig?: HeatmapExtraColumnConfig[];
  cellFormat: HeatmapCellFormat;
  cellUnit: string;
  caption: string;
  isLoading?: boolean;
  emptyMessage?: string;
  toneMode?: HeatmapToneMode;
  tooltipVariant?: HeatmapTooltipVariant;
  percentageDecimals?: number;
}
