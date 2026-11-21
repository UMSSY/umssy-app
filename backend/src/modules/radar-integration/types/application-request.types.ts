import type { z } from 'zod';
import type { applicationRequestSchema } from '../requests/application.request.js';

export type ApplicationRequest = z.infer<typeof applicationRequestSchema>;
