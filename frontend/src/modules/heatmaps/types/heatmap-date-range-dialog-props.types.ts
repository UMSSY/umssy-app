import type { HeatmapSemesterRange } from "./heatmap-semester-range.types";

export interface HeatmapDateRangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: HeatmapSemesterRange;
  onApply: (range: HeatmapSemesterRange) => void;
}
