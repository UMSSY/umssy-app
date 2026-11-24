import { BOLIVIA_OFFSET_MS } from '../../../common/constants/date-time.constants.js';
import { EventFinishedException } from '../exceptions/event-finished.exception.js';
import { RegistrationClosedException } from '../exceptions/registration-closed.exception.js';

export function assertRegistrationOpen(
  event: {
    eventDate: Date;
    startTime: Date;
    endTime: Date;
    sessions?: { startsAt: Date }[];
  },
  isFinished: boolean,
): void {
  const { eventDate, startTime, sessions } = event;
  if (isFinished) throw new EventFinishedException();

  // La inscripción y la cancelación cierran al iniciar la primera sesión.
  const startsAt = sessions?.length
    ? Math.min(...sessions.map((session) => session.startsAt.getTime()))
    : Date.UTC(
        eventDate.getUTCFullYear(),
        eventDate.getUTCMonth(),
        eventDate.getUTCDate(),
        startTime.getUTCHours(),
        startTime.getUTCMinutes(),
        startTime.getUTCSeconds(),
        startTime.getUTCMilliseconds(),
      ) - BOLIVIA_OFFSET_MS;
  if (Date.now() >= startsAt) throw new RegistrationClosedException();
}
