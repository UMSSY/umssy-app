import { z } from 'zod';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  REPORT_VALIDATION_MESSAGES as MESSAGES,
} from '../constants/report-validation.constants.js';
import type { PaginatedResult } from '../types/api-response.types.js';

export const paginationSchema = z.object({
  page: z.coerce
    .number({ error: MESSAGES.pageInvalid })
    .int({ error: MESSAGES.pageInvalid })
    .min(1, { error: MESSAGES.pageMin })
    .default(1),
  limit: z.coerce
    .number({ error: MESSAGES.limitInvalid })
    .int({ error: MESSAGES.limitInvalid })
    .min(1, { error: MESSAGES.limitMin })
    .max(MAX_PAGE_SIZE, { error: MESSAGES.limitMax })
    .default(DEFAULT_PAGE_SIZE),
});

export function paginate<T>(
  items: readonly T[],
  page: number,
  limit: number,
): PaginatedResult<T> {
  const start = (page - 1) * limit;

  return {
    items: items.slice(start, start + limit),
    totalItems: items.length,
    page,
    limit,
  };
}
