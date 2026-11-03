import { toUtcIso } from '@/shared/utils/date-time';
import { formatRegistrationTime } from './registration-format';

export function getEventEndTimestamp(eventDate: string, endTime: string): number {
  const clock = new Date(/^\d{2}:/.test(endTime) ? `1970-01-01T${endTime.length === 5 ? `${endTime}:00` : endTime}Z` : endTime);
  if (!Number.isFinite(clock.getTime())) return Number.NaN;
  try {
    return Date.parse(toUtcIso(eventDate.split('T')[0], formatRegistrationTime(endTime)))
      + clock.getUTCSeconds() * 1000 + clock.getUTCMilliseconds();
  } catch { return Number.NaN; }
}
