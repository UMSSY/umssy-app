import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  MAX_WEEK_QUERY_MS,
  WEEK_QUERY_MESSAGES,
} from '../constants/week-query.constants.js';

const isoDateTime = z.iso.datetime({
  offset: true,
  error: WEEK_QUERY_MESSAGES.invalidDate,
});

export const blockedDatesQuerySchema = z
  .strictObject({ from: isoDateTime, to: isoDateTime.optional() })
  .superRefine((query, ctx) => {
    if (!query.to) return;
    const duration =
      new Date(query.to).getTime() - new Date(query.from).getTime();
    if (duration <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['to'],
        message: WEEK_QUERY_MESSAGES.toBeforeFrom,
      });
    } else if (duration > MAX_WEEK_QUERY_MS) {
      ctx.addIssue({
        code: 'custom',
        path: ['to'],
        message: WEEK_QUERY_MESSAGES.rangeTooLong,
      });
    }
  });

export class BlockedDatesQueryDto extends createZodDto(
  blockedDatesQuerySchema,
) {}
