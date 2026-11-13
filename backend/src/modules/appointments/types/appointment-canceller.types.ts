import type { APPOINTMENT_CANCELLER } from '../constants/appointment-canceller.constants.js';

export type AppointmentCanceller =
  (typeof APPOINTMENT_CANCELLER)[keyof typeof APPOINTMENT_CANCELLER];
