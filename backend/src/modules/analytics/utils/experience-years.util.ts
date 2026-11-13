import { MS_PER_YEAR } from '../constants/heatmap.constants.js';
import type { WorkPeriod } from '../types/heatmap-graduate.types.js';

// Une periodos superpuestos para no contar dos veces el mismo tiempo trabajado.
export function computeExperienceYears(
  periods: WorkPeriod[],
  now: Date,
): number | null {
  const ranges = (periods ?? [])
    .map((period) => ({
      start: period.startDate.getTime(),
      end: Math.min((period.endDate ?? now).getTime(), now.getTime()),
    }))
    .filter((range) => range.end > range.start)
    .sort((first, second) => first.start - second.start);
  if (ranges.length === 0) return null;

  let total = 0;
  let current = { ...ranges[0]! };
  for (const range of ranges.slice(1)) {
    if (range.start <= current.end) {
      current.end = Math.max(current.end, range.end);
    } else {
      total += current.end - current.start;
      current = { ...range };
    }
  }
  total += current.end - current.start;
  return Math.round((total / MS_PER_YEAR) * 10) / 10;
}

export function getExperienceLevelIndex(years: number): number {
  if (years <= 2) return 0;
  return years <= 5 ? 1 : 2;
}
