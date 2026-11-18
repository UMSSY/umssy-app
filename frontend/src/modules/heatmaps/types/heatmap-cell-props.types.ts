import type { HeatmapCell } from "./heatmap-cell.types";
import type { HeatmapCellFormat } from "./heatmap-cell-format.types";
import type { HeatmapColumn } from "./heatmap-column.types";
import type { HeatmapToneMode } from "./heatmap-tone-mode.types";
import type { HeatmapTooltipVariant } from "./heatmap-tooltip-variant.types";

export interface HeatmapCellProps {
  cell?: HeatmapCell;
  column: HeatmapColumn;
  skillName: string;
  cellFormat: HeatmapCellFormat;
  cellUnit: string;
  toneMode?: HeatmapToneMode;
  tooltipVariant?: HeatmapTooltipVariant;
  percentageDecimals?: number;
}
