import type { HeatmapSemesterRange } from "./heatmap-semester-range.types";

export interface HeatmapFilters {
  careerId?: string;
  year?: string;
  month?: string;
  semesterRange?: HeatmapSemesterRange;
}
