import { z } from 'zod';
import { MAX_EVENT_SESSIONS } from '../constants/events.constants.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const ProposalSessionSchema = z
  .object({
    eventDate: z.iso.date({ error: 'Ingresa una fecha válida.' }),
    startTime: z
      .string()
      .regex(TIME_PATTERN, 'Usa una hora de 24 horas, como 14:30.'),
    endTime: z
      .string()
      .regex(TIME_PATTERN, 'Usa una hora de 24 horas, como 14:30.'),
    location: z.string().trim().max(300).optional(),
  })
  .strict()
  .refine((session) => session.endTime > session.startTime, {
    path: ['endTime'],
    message: 'La finalización debe ser posterior al inicio.',
  });

// El formulario se envía como multipart, por eso las sesiones llegan como texto JSON.
export const AdditionalSessionsSchema = z
  .string()
  .transform((value, context) => {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      context.addIssue({
        code: 'custom',
        message: 'Las sesiones no tienen un formato válido.',
      });
      return z.NEVER;
    }
  })
  .pipe(
    z
      .array(ProposalSessionSchema)
      .max(
        MAX_EVENT_SESSIONS - 1,
        `Agrega como máximo ${MAX_EVENT_SESSIONS} sesiones.`,
      ),
  );
