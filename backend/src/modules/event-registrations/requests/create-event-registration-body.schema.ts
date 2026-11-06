import { z } from 'zod';

export const CREATE_EVENT_REGISTRATION_BODY_SCHEMA = z.strictObject({
  eventId: z.guid({ error: 'El identificador del evento no es válido.' }),
});

export type { CreateEventRegistrationBody } from '../types/create-event-registration-body.types.js';
