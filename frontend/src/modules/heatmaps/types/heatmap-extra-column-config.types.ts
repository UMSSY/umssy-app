import type { HeatmapExtraValueFormat } from "./heatmap-extra-value-format.types";

export interface HeatmapExtraColumnConfig {
  id: string;
  label: string;
  sublabel?: string;
  format?: HeatmapExtraValueFormat;
}
