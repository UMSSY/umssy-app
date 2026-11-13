import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';

export const LEGACY_STATUS_TITLES: Partial<
  Record<string, AppointmentStatusTitle>
> = {
  [AppointmentStatusTitle.LEGACY_CONFIRMED]: AppointmentStatusTitle.CONFIRMED,
  [AppointmentStatusTitle.LEGACY_COMPLETED]: AppointmentStatusTitle.COMPLETED,
  [AppointmentStatusTitle.LEGACY_CANCELLED]: AppointmentStatusTitle.CANCELLED,
};
