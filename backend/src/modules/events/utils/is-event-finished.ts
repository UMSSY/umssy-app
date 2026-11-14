import { getBoliviaDateTimeAsUtc } from '../../../common/utils/date-time.js';

export function isEventFinished(
  eventDate: Date,
  endTime: Date,
  now: Date,
): boolean {
  return now.getTime() >= getBoliviaDateTimeAsUtc(eventDate, endTime).getTime();
}
