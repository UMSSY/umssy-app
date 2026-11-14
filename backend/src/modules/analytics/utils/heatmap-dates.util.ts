import {
  BOLIVIA_UTC_OFFSET,
  BOLIVIA_UTC_OFFSET_MS,
} from '../constants/heatmap.constants.js';

export function yearToRange(year: number): { from: Date; to: Date } {
  return {
    from: new Date(`${year}-01-01T00:00:00${BOLIVIA_UTC_OFFSET}`),
    to: new Date(`${year}-12-31T23:59:59.999${BOLIVIA_UTC_OFFSET}`),
  };
}

export function boliviaMonth(date: Date): number {
  return new Date(date.getTime() + BOLIVIA_UTC_OFFSET_MS).getUTCMonth() + 1;
}

export function shortenCareerTitle(title: string): string {
  return (title ?? '')
    .trim()
    .replace(/^Licenciatura\s+(en\s+)?/i, '')
    .replace(/^Ingeniería\s+en\s+/i, 'Ing. ')
    .replace(/^Ingeniería\s+/i, 'Ing. ');
}
