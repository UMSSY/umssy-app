import { BOLIVIA_OFFSET_MS } from '../../../common/constants/date-time.constants.js';
import { EventFinishedException } from '../exceptions/event-finished.exception.js';
import { RegistrationClosedException } from '../exceptions/registration-closed.exception.js';

export function assertRegistrationOpen(event: { eventDate: Date; startTime: Date; endTime: Date }): void {
  const { eventDate, startTime, endTime } = event;
  const endsAt = Date.UTC(
    eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate(),
    endTime.getUTCHours(), endTime.getUTCMinutes(), endTime.getUTCSeconds(),
    endTime.getUTCMilliseconds(),
  ) - BOLIVIA_OFFSET_MS;
  if (Date.now() >= endsAt) throw new EventFinishedException();

  const startsAt = Date.UTC(
    eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate(),
    startTime.getUTCHours(), startTime.getUTCMinutes(), startTime.getUTCSeconds(),
    startTime.getUTCMilliseconds(),
  ) - BOLIVIA_OFFSET_MS;
  if (Date.now() >= startsAt) throw new RegistrationClosedException();
}
