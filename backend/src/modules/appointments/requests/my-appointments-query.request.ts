import { z } from 'zod';
import { APPOINTMENT_MESSAGES } from '../constants/appointment-docs.constants.js';

export const myAppointmentsQuerySchema = z.strictObject({
  scope: z
    .enum(['upcoming', 'past'], {
      error: APPOINTMENT_MESSAGES.invalidScope,
    })
    .default('upcoming'),
});
