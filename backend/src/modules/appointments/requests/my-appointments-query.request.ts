import { z } from 'zod';
import { APPOINTMENT_MESSAGES } from '../constants/appointment-docs.constants.js';
import {
  DEFAULT_MY_APPOINTMENTS_PAGE,
  DEFAULT_MY_APPOINTMENTS_PAGE_SIZE,
  MAX_MY_APPOINTMENTS_PAGE_SIZE,
} from '../constants/my-appointments-pagination.constants.js';

export const myAppointmentsQuerySchema = z.strictObject({
  scope: z
    .enum(['upcoming', 'past'], {
      error: APPOINTMENT_MESSAGES.invalidScope,
    })
    .default('upcoming'),
  page: z.coerce
    .number({ error: APPOINTMENT_MESSAGES.invalidPage })
    .int({ error: APPOINTMENT_MESSAGES.invalidPage })
    .min(1, { error: APPOINTMENT_MESSAGES.invalidPage })
    .default(DEFAULT_MY_APPOINTMENTS_PAGE),
  pageSize: z.coerce
    .number({ error: APPOINTMENT_MESSAGES.invalidPageSize })
    .int({ error: APPOINTMENT_MESSAGES.invalidPageSize })
    .min(1, { error: APPOINTMENT_MESSAGES.invalidPageSize })
    .max(MAX_MY_APPOINTMENTS_PAGE_SIZE, {
      error: APPOINTMENT_MESSAGES.invalidPageSize,
    })
    .default(DEFAULT_MY_APPOINTMENTS_PAGE_SIZE),
});
