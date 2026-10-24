export interface ExperiencePeriod {
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
}

interface Interval {
  start: number;
  end: number;
}

function monthsBetween(start: Date, end: Date): number {
  return (
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth())
  );
}

function mergeOverlapping(intervals: Interval[]): Interval[] {
  const merged: Interval[] = [];
  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (last !== undefined && interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }
  return merged;
}

export function calculateExperienceYears(
  periods: readonly ExperiencePeriod[],
  now: Date,
): number {
  const intervals = periods
    .map(({ startDate, endDate, isCurrent }) => ({
      start: startDate.getTime(),
      end: (isCurrent || endDate === null ? now : endDate).getTime(),
    }))
    .filter(({ start, end }) => end > start)
    .sort((left, right) => left.start - right.start);

  const months = mergeOverlapping(intervals).reduce(
    (total, { start, end }) =>
      total + monthsBetween(new Date(start), new Date(end)),
    0,
  );
  return months / 12;
}
