import { z } from 'zod';

export const EVENT_REGISTRATION_PARAMS_SCHEMA = z.object({
  eventId: z.guid({ error: 'El identificador del evento no es válido.' }),
});

export const REGISTRATION_PARAMS_SCHEMA = z.object({
  registrationId: z.guid({ error: 'El identificador de la inscripción no es válido.' }),
});

export const REGISTRATION_ID_SCHEMA = z.object({
  id: z.guid({ error: 'El identificador de la inscripción no es válido.' }),
});

export type EventRegistrationParams = z.infer<typeof EVENT_REGISTRATION_PARAMS_SCHEMA>;
export type RegistrationParams = z.infer<typeof REGISTRATION_PARAMS_SCHEMA>;
export type RegistrationIdParam = z.infer<typeof REGISTRATION_ID_SCHEMA>;
