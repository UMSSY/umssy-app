import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { toBoliviaTime } from '../../../common/utils/date-time.js';
import { CREATE_BLOCK_MESSAGES, MAX_REPEAT_WEEKS } from '../constants/create-block.constants.js';
import { addWeeks } from '../utils/weekly-occurrences.js';
import { buildBlockTimeSchema } from './block-time.schema.js';

export const buildCreateBlockSchema = (getNow: () => Date = () => new Date()) =>
  buildBlockTimeSchema(getNow)
    .safeExtend({
      repeatWeekly: z.boolean().optional(),
      repeatUntil: z.iso.date({ error: CREATE_BLOCK_MESSAGES.invalidRepeatUntil }).optional(),
    })
    .superRefine((payload, ctx) => {
      if (!payload.repeatWeekly) {
        if (payload.repeatUntil !== undefined) {
          ctx.addIssue({
            code: 'custom',
            path: ['repeatUntil'],
            message: CREATE_BLOCK_MESSAGES.repeatNotEnabled,
          });
        }
        return;
      }
      if (payload.repeatUntil === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['repeatUntil'],
          message: CREATE_BLOCK_MESSAGES.repeatUntilRequired,
        });
        return;
      }
      const firstDay = toBoliviaTime(payload.startAt).date;
      const lastDay = toBoliviaTime(addWeeks(payload.startAt, MAX_REPEAT_WEEKS)).date;
      if (payload.repeatUntil < firstDay || payload.repeatUntil > lastDay) {
        ctx.addIssue({
          code: 'custom',
          path: ['repeatUntil'],
          message: CREATE_BLOCK_MESSAGES.repeatUntilOutOfRange,
        });
      }
    });

export const createBlockSchema = buildCreateBlockSchema();

export class CreateBlockDto extends createZodDto(createBlockSchema) {}
