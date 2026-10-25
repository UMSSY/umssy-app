import { BOLIVIA_OFFSET_MS } from '../../../common/constants/date-time.constants.js';
import { RegistrationClosedException } from '../exceptions/registration-closed.exception.js';

export function assertRegistrationOpen(event: { eventDate: Date; startTime: Date }): void {
  const { eventDate, startTime } = event;
  const startsAt = Date.UTC(
    eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate(),
    startTime.getUTCHours(), startTime.getUTCMinutes(), startTime.getUTCSeconds(),
    startTime.getUTCMilliseconds(),
  ) - BOLIVIA_OFFSET_MS;
  if (Date.now() >= startsAt) throw new RegistrationClosedException();
}
