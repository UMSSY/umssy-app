import type { z } from 'zod';
import type { CREATE_EVENT_REGISTRATION_BODY_SCHEMA } from '../requests/create-event-registration-body.schema.js';

export type CreateEventRegistrationBody = z.infer<typeof CREATE_EVENT_REGISTRATION_BODY_SCHEMA>;
