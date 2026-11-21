import { z } from 'zod';
import { APPOINTMENT_MESSAGES } from '../constants/appointment-docs.constants.js';
import {
  DEFAULT_MY_APPOINTMENTS_PAGE,
  DEFAULT_MY_APPOINTMENTS_PAGE_SIZE,
  MAX_MY_APPOINTMENTS_PAGE_SIZE,
} from '../constants/my-appointments-pagination.constants.js';
import { MAX_MY_APPOINTMENTS_SEARCH_LENGTH } from '../constants/my-appointments-search.constants.js';

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
  q: z
    .string({ error: APPOINTMENT_MESSAGES.invalidSearch })
    .trim()
    .max(MAX_MY_APPOINTMENTS_SEARCH_LENGTH, {
      error: APPOINTMENT_MESSAGES.invalidSearch,
    })
    .optional()
    .transform((value) => value || undefined),
});
