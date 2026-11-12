import { BOLIVIA_UTC_OFFSET_HOURS } from "../constants/heatmap-filters.constants";
import type { HeatmapFilters } from "../types/heatmap-filters.types";
import type { HeatmapGraduateRecord } from "../types/heatmap-graduate-record.types";
import { semesterRangeToTimestamps } from "./semester-range-to-timestamps";

function toBoliviaParts(iso: string) {
  const local = new Date(Date.parse(iso) + BOLIVIA_UTC_OFFSET_HOURS * 3_600_000);
  return { year: String(local.getUTCFullYear()), month: String(local.getUTCMonth() + 1) };
}

export function filterHeatmapRecords(records: HeatmapGraduateRecord[], filters: HeatmapFilters): HeatmapGraduateRecord[] {
  const range = filters.semesterRange ? semesterRangeToTimestamps(filters.semesterRange) : undefined;
  const start = range ? Date.parse(range.startTimestamp) : undefined;
  const end = range ? Date.parse(range.endTimestamp) : undefined;

  return (records ?? []).filter((record) => {
    if (filters.career && record.career !== filters.career) return false;
    const answeredAt = Date.parse(record.answeredAt);
    if (start !== undefined && end !== undefined) {
      if (answeredAt < start || answeredAt > end) return false;
    }
    const parts = toBoliviaParts(record.answeredAt);
    if (!range && filters.year && parts.year !== filters.year) return false;
    if (filters.month && parts.month !== filters.month) return false;
    return true;
  });
}
