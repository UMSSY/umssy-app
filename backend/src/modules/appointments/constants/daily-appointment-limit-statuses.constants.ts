import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { ACTIVE_APPOINTMENT_STATUS_TITLES } from './active-appointment-statuses.constants.js';

export const DAILY_APPOINTMENT_LIMIT_STATUS_TITLES = [
  ...ACTIVE_APPOINTMENT_STATUS_TITLES,
  AppointmentStatusTitle.COMPLETED,
];
