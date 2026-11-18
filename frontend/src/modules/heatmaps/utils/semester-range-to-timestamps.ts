import { BOLIVIA_UTC_OFFSET, HEATMAP_SEMESTER_BOUNDS } from "../constants/heatmap-filters.constants";
import type { HeatmapDateRange } from "../types/heatmap-date-range.types";
import type { HeatmapSemesterRange } from "../types/heatmap-semester-range.types";

export function semesterRangeToTimestamps(range: HeatmapSemesterRange): HeatmapDateRange {
  return {
    startTimestamp: `${range.startYear}-${HEATMAP_SEMESTER_BOUNDS[range.startSemester].start}${BOLIVIA_UTC_OFFSET}`,
    endTimestamp: `${range.endYear}-${HEATMAP_SEMESTER_BOUNDS[range.endSemester].end}${BOLIVIA_UTC_OFFSET}`,
  };
}

export function isValidSemesterRange(range: HeatmapSemesterRange): boolean {
  return range.startYear * 10 + range.startSemester <= range.endYear * 10 + range.endSemester;
}

export function formatSemesterRange(range: HeatmapSemesterRange): string {
  return `${range.startYear}-${range.startSemester} a ${range.endYear}-${range.endSemester}`;
}
