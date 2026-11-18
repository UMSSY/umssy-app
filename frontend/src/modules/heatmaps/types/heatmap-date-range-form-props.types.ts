import type { HeatmapSemesterRange } from "./heatmap-semester-range.types";

export interface HeatmapDateRangeFormProps {
  value?: HeatmapSemesterRange;
  onCancel: () => void;
  onApply: (range: HeatmapSemesterRange) => void;
}
