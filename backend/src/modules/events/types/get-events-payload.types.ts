import type { z } from 'zod';
import type { GetEventsSchema } from '../requests/get-events.request.js';

export type GetEventsPayload = z.infer<typeof GetEventsSchema>;
