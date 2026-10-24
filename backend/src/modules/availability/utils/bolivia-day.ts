import { DAY_MS } from '../../../common/constants/date-time.constants.js';
import { toBoliviaTime, toUtcIso } from '../../../common/utils/date-time.js';
import type { BoliviaDayRange } from '../types/bolivia-day-range.types.js';

export const toCalendarDate = (day: string): Date => new Date(`${day}T00:00:00.000Z`);

export const toDayString = (calendarDate: Date): string => calendarDate.toISOString().slice(0, 10);

export const getBoliviaDayRange = (day: string): BoliviaDayRange => {
  const startAt = new Date(toUtcIso(day, '00:00'));
  return { startAt, endAt: new Date(startAt.getTime() + DAY_MS) };
};

export const getBoliviaToday = (now: Date = new Date()): string => toBoliviaTime(now).date;

// El rango de las consultas es semiabierto [from, to): el último día es el de to menos 1 ms.
export const getLastBoliviaDay = (to: Date): string => toBoliviaTime(new Date(to.getTime() - 1)).date;
