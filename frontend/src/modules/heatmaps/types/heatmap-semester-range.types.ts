import type { HeatmapSemester } from "./heatmap-semester.types";

export interface HeatmapSemesterRange {
  startYear: number;
  startSemester: HeatmapSemester;
  endYear: number;
  endSemester: HeatmapSemester;
}
