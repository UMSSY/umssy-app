import type { HeatmapExtraColumnConfig } from "./heatmap-extra-column-config.types";
import type { HeatmapExtraValue } from "./heatmap-extra-value.types";

export interface HeatmapExtraValueProps {
  value?: HeatmapExtraValue;
  config: HeatmapExtraColumnConfig;
}
