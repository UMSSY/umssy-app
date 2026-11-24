import { z } from 'zod';
import { MAX_PAGE_SIZE } from '../../events/constants/events.constants.js';

export const GetMyRegistrationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(10),
  scope: z.enum(['finished']).optional(),
});
