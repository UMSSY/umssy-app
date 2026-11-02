import type { z } from 'zod';
import type { EVENT_REGISTRATION_PARAMS_SCHEMA } from '../requests/registration-params.schema.js';

export type EventRegistrationParams = z.infer<typeof EVENT_REGISTRATION_PARAMS_SCHEMA>;
