import type { z } from 'zod';
import type { applicationConsentsSchema } from '../requests/application-consents.request.js';

export type ApplicationConsentsRequest = z.infer<
  typeof applicationConsentsSchema
>;
