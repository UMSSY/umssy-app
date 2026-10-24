import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { APPOINTMENT_MESSAGES } from '../constants/appointment-docs.constants.js';

export const createAppointmentSchema = z.strictObject({
  blockId: z.uuid({ error: APPOINTMENT_MESSAGES.invalidBlockId }),
  orientationTypeId: z.uuid({
    error: (issue) =>
      issue.input === undefined
        ? APPOINTMENT_MESSAGES.missingTopic
        : APPOINTMENT_MESSAGES.invalidTopic,
  }),
  message: z
    .string()
    .max(300, { error: APPOINTMENT_MESSAGES.messageTooLong })
    .optional(),
});

export class CreateAppointmentDto extends createZodDto(createAppointmentSchema) {}
