import type { z } from 'zod';
import type { GetEventCategoriesSchema } from '../requests/get-event-categories.request.js';

export type GetEventCategoriesPayload = z.infer<typeof GetEventCategoriesSchema>;
