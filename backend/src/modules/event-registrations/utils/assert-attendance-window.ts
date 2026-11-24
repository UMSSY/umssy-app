import { BOLIVIA_OFFSET_MS } from '../../../common/constants/date-time.constants.js';
import { AttendanceOutsideWindowException } from '../exceptions/attendance-outside-window.exception.js';

type WorkshopSchedule = { eventDate: Date; startTime: Date; endTime: Date };

const ATTENDANCE_OPEN_EARLY_MS = 2 * 60 * 60 * 1000;

function localScheduleInstant(eventDate: Date, time: Date): number {
  return (
    Date.UTC(
      eventDate.getUTCFullYear(),
      eventDate.getUTCMonth(),
      eventDate.getUTCDate(),
      time.getUTCHours(),
      time.getUTCMinutes(),
      time.getUTCSeconds(),
      time.getUTCMilliseconds(),
    ) - BOLIVIA_OFFSET_MS
  );
}

export function assertAttendanceWindow(
  schedule: WorkshopSchedule,
  now: Date,
): void {
  const startsAt = localScheduleInstant(schedule.eventDate, schedule.startTime);
  const opensAt = startsAt - ATTENDANCE_OPEN_EARLY_MS;
  const endsAt = localScheduleInstant(schedule.eventDate, schedule.endTime);
  const checkedAt = now.getTime();
  if (checkedAt < opensAt || checkedAt >= endsAt) {
    throw new AttendanceOutsideWindowException();
  }
}
