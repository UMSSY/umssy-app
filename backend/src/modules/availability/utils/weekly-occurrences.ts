import { DAY_MS } from '../../../common/constants/date-time.constants.js';
import { toBoliviaTime } from '../../../common/utils/date-time.js';

// Bolivia uses UTC-04 year-round, so adding seven days preserves the local time.
export const addWeeks = (instant: Date, weeks: number): Date =>
  new Date(instant.getTime() + weeks * 7 * DAY_MS);

export function* weeklyOccurrences(startAt: Date, endAt: Date, repeatUntil: string) {
  for (let week = 0; ; week++) {
    const start = addWeeks(startAt, week);
    const day = toBoliviaTime(start).date;
    if (day > repeatUntil) return;
    yield { startAt: start, endAt: addWeeks(endAt, week), day };
  }
}
