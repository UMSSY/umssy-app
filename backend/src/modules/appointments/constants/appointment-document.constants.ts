import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';

export const APPOINTMENT_DOCUMENT_OPEN_STATUSES: readonly string[] = [
  AppointmentStatusTitle.CONFIRMED,
  AppointmentStatusTitle.LEGACY_CONFIRMED,
];
