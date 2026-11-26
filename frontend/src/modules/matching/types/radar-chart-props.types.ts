import type { AffinityAxisId } from "./affinity-axis-id.types";
import type { RadarChartAxis } from "./radar-chart-axis.types";
import type { RadarChartSeries } from "./radar-chart-series.types";

export interface RadarChartProps {
  axes: RadarChartAxis[];
  series: RadarChartSeries[];
  maxValue?: number;
  height?: number;
  onAxisSelect?: (axisId: AffinityAxisId) => void;
}
