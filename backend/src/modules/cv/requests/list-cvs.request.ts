import { z } from 'zod';
import { MAX_PAGE_SIZE, paginationSchema } from '../../../common/utils/pagination.js';
import { CV_DEFAULT_PAGE_SIZE } from '../constants/cv.constants.js';

export const listCvsSchema = paginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(CV_DEFAULT_PAGE_SIZE),
});

export type ListCvsRequest = z.infer<typeof listCvsSchema>;
