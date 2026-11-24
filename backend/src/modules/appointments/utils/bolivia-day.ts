import {
  BOLIVIA_OFFSET_MS,
  DAY_MS,
} from '../../../common/constants/date-time.constants.js';
import type { BoliviaDayRange } from '../types/bolivia-day-range.types.js';

export const getBoliviaDayRange = (instant: Date): BoliviaDayRange => {
  const localMs = instant.getTime() + BOLIVIA_OFFSET_MS;
  const startMs = Math.floor(localMs / DAY_MS) * DAY_MS - BOLIVIA_OFFSET_MS;

  return { start: new Date(startMs), end: new Date(startMs + DAY_MS) };
};
