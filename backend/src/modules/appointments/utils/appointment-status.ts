import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { LEGACY_STATUS_TITLES } from '../constants/legacy-status-titles.constants.js';

// Una cita confirmada se muestra completada desde su hora exacta de fin; no se escribe en la base.
export const resolveAppointmentStatus = (
  title: string,
  endAt: Date,
  now: Date,
): string => {
  const status = LEGACY_STATUS_TITLES[title] ?? title;

  return status === AppointmentStatusTitle.CONFIRMED &&
    endAt.getTime() <= now.getTime()
    ? AppointmentStatusTitle.COMPLETED
    : status;
};
