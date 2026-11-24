import type { ReactNode } from "react";
import type { HeatmapCareerOption } from "./heatmap-career-option.types";
import type { HeatmapExportFormat } from "./heatmap-export-format.types";
import type { HeatmapFilters } from "./heatmap-filters.types";
import type { HeatmapViewConfig } from "./heatmap-view-config.types";

export interface HeatmapToolbarProps {
  config: HeatmapViewConfig;
  filters: HeatmapFilters;
  careerOptions: HeatmapCareerOption[];
  onCareerChange: (careerId?: string) => void;
  onYearChange: (year?: string) => void;
  onMonthChange: (month?: string) => void;
  onOpenDateRange: () => void;
  onClearDateRange: () => void;
  onClearFilters: () => void;
  onExport: (format: HeatmapExportFormat) => void;
  canExport: boolean;
  aside?: ReactNode;
}
