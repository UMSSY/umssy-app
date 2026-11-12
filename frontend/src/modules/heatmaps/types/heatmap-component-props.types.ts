import type { HeatmapCareerId } from "./heatmap-graduate-record.types";
import type { HeatmapFilters, HeatmapSemesterRange } from "./heatmap-filters.types";
import type { HeatmapCell, HeatmapColumn, HeatmapExtraColumnConfig, HeatmapExtraValue, HeatmapRow } from "./heatmap.types";
import type { HeatmapCellFormat, HeatmapViewConfig } from "./heatmap-view-config.types";

export type HeatmapExportFormat = "pdf" | "csv";

export interface HeatmapMatrixProps {
  columns: HeatmapColumn[];
  rows: HeatmapRow[];
  extraColumnsConfig?: HeatmapExtraColumnConfig[];
  cellFormat: HeatmapCellFormat;
  cellUnit: string;
  caption: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export interface HeatmapCellProps {
  cell?: HeatmapCell;
  column: HeatmapColumn;
  skillName: string;
  cellFormat: HeatmapCellFormat;
  cellUnit: string;
}

export interface HeatmapBaseIndicatorProps {
  baseCount: number;
  baseLabel: string;
}

export interface HeatmapQuickReadProps {
  summary?: string;
}

export interface HeatmapToolbarProps {
  config: HeatmapViewConfig;
  filters: HeatmapFilters;
  onCareerChange: (career?: HeatmapCareerId) => void;
  onYearChange: (year?: string) => void;
  onMonthChange: (month?: string) => void;
  onOpenDateRange: () => void;
  onClearDateRange: () => void;
  onExport: (format: HeatmapExportFormat) => void;
  canExport: boolean;
}

export interface HeatmapDateRangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: HeatmapSemesterRange;
  onApply: (range: HeatmapSemesterRange) => void;
}

export interface HeatmapDateRangeFormProps {
  value?: HeatmapSemesterRange;
  onCancel: () => void;
  onApply: (range: HeatmapSemesterRange) => void;
}

export interface HeatmapExportMenuProps {
  onExport: (format: HeatmapExportFormat) => void;
  disabled: boolean;
}

export interface HeatmapViewProps {
  type: HeatmapViewConfig["type"];
}

export interface HeatmapExtraValueProps {
  value?: HeatmapExtraValue;
  config: HeatmapExtraColumnConfig;
}
