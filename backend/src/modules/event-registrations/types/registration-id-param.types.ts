import type { z } from 'zod';
import type { REGISTRATION_ID_SCHEMA } from '../requests/registration-params.schema.js';

export type RegistrationIdParam = z.infer<typeof REGISTRATION_ID_SCHEMA>;
