import { AVERAGE_YEAR_MS } from '../constants/heatmap.constants.js';
import type { TimeRange } from '../types/time-range.types.js';
import type { WorkPeriod } from '../types/work-period.types.js';

function toElapsedRanges(periods: WorkPeriod[], now: Date): TimeRange[] {
  return (periods ?? [])
    .map((period) => ({
      start: period.startDate.getTime(),
      end: Math.min((period.endDate ?? now).getTime(), now.getTime()),
    }))
    .filter((range) => range.end > range.start)
    .sort((first, second) => first.start - second.start);
}

function mergeOverlappingRanges(sortedRanges: TimeRange[]): TimeRange[] {
  const merged: TimeRange[] = [];
  for (const range of sortedRanges) {
    const last = merged.at(-1);
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}

function sumDurations(ranges: TimeRange[]): number {
  return ranges.reduce((total, range) => total + (range.end - range.start), 0);
}

export function computeExperienceYears(
  periods: WorkPeriod[],
  now: Date,
): number | null {
  const ranges = toElapsedRanges(periods, now);
  if (ranges.length === 0) return null;
  const workedMs = sumDurations(mergeOverlappingRanges(ranges));
  return Math.round((workedMs / AVERAGE_YEAR_MS) * 10) / 10;
}

export function getExperienceLevelIndex(years: number): number {
  if (years <= 2) return 0;
  return years <= 5 ? 1 : 2;
}
