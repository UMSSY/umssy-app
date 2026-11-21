import { BOLIVIA_OFFSET_MS } from '../../../common/constants/date-time.constants.js';
import { toBoliviaTime } from '../../../common/utils/date-time.js';

function boliviaYearStart(year: number): number {
  return Date.UTC(year, 0, 1) - BOLIVIA_OFFSET_MS;
}

export function yearToRange(year: number): { from: Date; to: Date } {
  return {
    from: new Date(boliviaYearStart(year)),
    to: new Date(boliviaYearStart(year + 1) - 1),
  };
}

export function boliviaMonth(date: Date): number {
  return toBoliviaTime(date).month;
}

export function shortenCareerTitle(title: string): string {
  return (title ?? '')
    .trim()
    .replace(/^Licenciatura\s+(en\s+)?/i, '')
    .replace(/^Ingeniería\s+en\s+/i, 'Ing. ')
    .replace(/^Ingeniería\s+/i, 'Ing. ');
}
