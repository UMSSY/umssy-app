import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { ACTIVE_APPOINTMENT_STATUS_TITLES } from './active-appointment-statuses.constants.js';
import { CANCELLED_APPOINTMENT_STATUS_TITLES } from './cancelled-appointment-statuses.constants.js';

export const PAST_APPOINTMENT_STATUS_TITLES = [
  ...ACTIVE_APPOINTMENT_STATUS_TITLES,
  AppointmentStatusTitle.COMPLETED,
  AppointmentStatusTitle.LEGACY_COMPLETED,
  ...CANCELLED_APPOINTMENT_STATUS_TITLES,
];
