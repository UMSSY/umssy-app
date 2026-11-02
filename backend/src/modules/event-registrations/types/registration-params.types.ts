import type { z } from 'zod';
import type { REGISTRATION_PARAMS_SCHEMA } from '../requests/registration-params.schema.js';

export type RegistrationParams = z.infer<typeof REGISTRATION_PARAMS_SCHEMA>;
