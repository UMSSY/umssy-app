import type { HeatmapCell } from "./heatmap-cell.types";
import type { HeatmapCellFormat } from "./heatmap-cell-format.types";
import type { HeatmapColumn } from "./heatmap-column.types";

export interface HeatmapCellProps {
  cell?: HeatmapCell;
  column: HeatmapColumn;
  skillName: string;
  cellFormat: HeatmapCellFormat;
  cellUnit: string;
}
