import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';

// Una cita confirmada se muestra completada desde su hora exacta de fin; no se escribe en la base.
export const resolveAppointmentStatus = (
  title: string,
  endAt: Date,
  now: Date,
): string => {
  const status =
    title === AppointmentStatusTitle.LEGACY_CONFIRMED
      ? AppointmentStatusTitle.CONFIRMED
      : title;

  return status === AppointmentStatusTitle.CONFIRMED &&
    endAt.getTime() <= now.getTime()
    ? AppointmentStatusTitle.COMPLETED
    : status;
};
