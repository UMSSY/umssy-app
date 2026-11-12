import type { HeatmapCareerId } from "./heatmap-graduate-record.types";

export type HeatmapSemester = 1 | 2;

export interface HeatmapSemesterRange {
  startYear: number;
  startSemester: HeatmapSemester;
  endYear: number;
  endSemester: HeatmapSemester;
}

export interface HeatmapDateRange {
  startTimestamp: string;
  endTimestamp: string;
}

export interface HeatmapFilters {
  career?: HeatmapCareerId;
  year?: string;
  month?: string;
  semesterRange?: HeatmapSemesterRange;
}
