import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  BLOCKED_DATE_MESSAGES,
  BLOCKED_DATE_REASON_MAX_LENGTH,
} from '../constants/blocked-date.constants.js';

export const blockDateSchema = z.strictObject({
  blockedOn: z.iso.date({ error: BLOCKED_DATE_MESSAGES.invalidDate }),
  reason: z
    .string({ error: BLOCKED_DATE_MESSAGES.invalidReason })
    .trim()
    .max(BLOCKED_DATE_REASON_MAX_LENGTH, { error: BLOCKED_DATE_MESSAGES.reasonTooLong })
    .nullish()
    .transform((reason) => reason || null),
});

export class BlockDateDto extends createZodDto(blockDateSchema) {}
