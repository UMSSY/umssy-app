import { getBoliviaDateTimeAsUtc } from '../../../common/utils/date-time.js';
import { EventFinishedException } from '../exceptions/event-finished.exception.js';
import { RegistrationClosedException } from '../exceptions/registration-closed.exception.js';

export function assertRegistrationOpen(event: {
  eventDate: Date;
  startTime: Date;
  endTime: Date;
}): void {
  const { eventDate, startTime, endTime } = event;
  const now = new Date();
  if (now >= getBoliviaDateTimeAsUtc(eventDate, endTime))
    throw new EventFinishedException();

  if (now >= getBoliviaDateTimeAsUtc(eventDate, startTime))
    throw new RegistrationClosedException();
}
