import type { HeatmapExportFormat } from "./heatmap-export-format.types";

export interface HeatmapExportMenuProps {
  onExport: (format: HeatmapExportFormat) => void;
  disabled: boolean;
}
