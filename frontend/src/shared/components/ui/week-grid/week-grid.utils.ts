const BOLIVIA_OFFSET_HOURS = 4;         // bolivia usa UTC-4 todo el año
export const HOUR_HEIGHT_PX = 25;

export function shiftToBoliviaWallClock(isoUtc: string): Date {
  return new Date(new Date(isoUtc).getTime() - BOLIVIA_OFFSET_HOURS * 60 * 60 * 1000);
}

// obtiene una clave para comparar dias
function toCalendarDayKey(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function getWeekDayIndex(blockStartIsoUtc: string, weekStart: Date): number | null {
  const boliviaStart = shiftToBoliviaWallClock(blockStartIsoUtc);
  const dayDiffMs = toCalendarDayKey(boliviaStart) - toCalendarDayKey(weekStart);
  const dayDiff = Math.round(dayDiffMs / (24 * 60 * 60 * 1000));
  return dayDiff >= 0 && dayDiff <= 6 ? dayDiff : null;
}

export function formatBoliviaTime(isoUtc: string): string {
  const d = shiftToBoliviaWallClock(isoUtc);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function getBlockVerticalPosition(
  blockStartIsoUtc: string,
  blockEndIsoUtc: string,
  startHour: number,
  endHour: number
): { topPx: number; heightPx: number } {
  const start = shiftToBoliviaWallClock(blockStartIsoUtc);
  const end = shiftToBoliviaWallClock(blockEndIsoUtc);

  const startMinutesFromGridStart = Math.max(
    0,
    (start.getUTCHours() - startHour) * 60 + start.getUTCMinutes()
  );
  const endMinutesFromGridStart = Math.min(
    (endHour - startHour) * 60,
    (end.getUTCHours() - startHour) * 60 + end.getUTCMinutes()
  );

  const pxPerMinute = HOUR_HEIGHT_PX / 60;
  const topPx = startMinutesFromGridStart * pxPerMinute;
  const heightPx = Math.max(0, endMinutesFromGridStart - startMinutesFromGridStart) * pxPerMinute;

  return { topPx, heightPx };
}

export const DAY_LABELS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"] as const;