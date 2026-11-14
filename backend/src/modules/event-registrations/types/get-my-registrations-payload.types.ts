import type { z } from 'zod';
import type { GetMyRegistrationsSchema } from '../requests/get-my-registrations.request.js';

export type GetMyRegistrationsPayload = z.infer<
  typeof GetMyRegistrationsSchema
>;
