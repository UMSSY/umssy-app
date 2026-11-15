import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { APPOINTMENT_MESSAGES } from '../constants/appointment-docs.constants.js';
import { CANCELLATION_REASON_MAX_LENGTH } from '../constants/cancellation.constants.js';

export const cancelAppointmentSchema = z.strictObject({
  reason: z
    .string({ error: APPOINTMENT_MESSAGES.invalidReason })
    .trim()
    .max(CANCELLATION_REASON_MAX_LENGTH, {
      error: APPOINTMENT_MESSAGES.reasonTooLong,
    })
    .optional(),
});

export class CancelAppointmentDto extends createZodDto(
  cancelAppointmentSchema,
) {}
