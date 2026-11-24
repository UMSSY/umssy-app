import { ACTIVE_APPOINTMENT_STATUS_TITLES } from './active-appointment-statuses.constants.js';
import { CANCELLED_APPOINTMENT_STATUS_TITLES } from './cancelled-appointment-statuses.constants.js';

export const UPCOMING_APPOINTMENT_STATUS_TITLES = [
  ...ACTIVE_APPOINTMENT_STATUS_TITLES,
  ...CANCELLED_APPOINTMENT_STATUS_TITLES,
];
