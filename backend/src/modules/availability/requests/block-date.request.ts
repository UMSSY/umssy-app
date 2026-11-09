import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { BLOCKED_DATE_MESSAGES } from '../constants/blocked-date.constants.js';

export const blockDateSchema = z.strictObject({
  blockedOn: z.iso.date({ error: BLOCKED_DATE_MESSAGES.invalidDate }),
  reason: z
    .string({ error: BLOCKED_DATE_MESSAGES.invalidReason })
    .trim()
    .max(100, { error: BLOCKED_DATE_MESSAGES.reasonTooLong })
    .nullish()
    .transform((reason) => reason || null),
});

export class BlockDateDto extends createZodDto(blockDateSchema) {}
