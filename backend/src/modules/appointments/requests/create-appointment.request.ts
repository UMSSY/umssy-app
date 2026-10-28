import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  APPOINTMENT_MESSAGES,
  APPOINTMENT_MESSAGE_MAX_LENGTH,
} from '../constants/appointment-docs.constants.js';

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
    .trim()
    .max(APPOINTMENT_MESSAGE_MAX_LENGTH, {
      error: APPOINTMENT_MESSAGES.messageTooLong,
    })
    .nullish()
    .transform((message) => message || null),
});

export class CreateAppointmentDto extends createZodDto(createAppointmentSchema) {}
