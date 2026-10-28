import { WEEK_MS } from '../../../common/constants/date-time.constants.js';
import { toBoliviaTime } from '../../../common/utils/date-time.js';

export function* weeklyOccurrences(startAt: Date, endAt: Date, repeatUntil: string) {
  for (let week = 0; ; week++) {
    // Bolivia usa UTC-04 todo el año: sumar semanas conserva la hora local.
    const start = new Date(startAt.getTime() + week * WEEK_MS);
    const day = toBoliviaTime(start).date;
    if (day > repeatUntil) return;
    yield { startAt: start, endAt: new Date(endAt.getTime() + week * WEEK_MS), day };
  }
}
