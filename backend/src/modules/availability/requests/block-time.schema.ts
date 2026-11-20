import { z } from 'zod';
import { toBoliviaTime } from '../../../common/utils/date-time.js';
import type { BlockDurationRule } from '../types/block-duration-rule.types.js';
import {
  BLOCK_DURATION_MINUTES,
  BLOCK_MAX_HOUR,
  BLOCK_MIN_HOUR,
  BLOCK_STEP_MINUTES,
  CREATE_BLOCK_MESSAGES,
} from '../constants/create-block.constants.js';

const getBoliviaParts = (date: Date) => {
  const { date: day, hours, minutes } = toBoliviaTime(date);
  return {
    day,
    minutesOfDay: hours * 60 + minutes,
    isOnStep:
      minutes % BLOCK_STEP_MINUTES === 0 &&
      date.getUTCSeconds() === 0 &&
      date.getUTCMilliseconds() === 0,
  };
};

const isoDateTime = z.iso.datetime({
  offset: true,
  error: CREATE_BLOCK_MESSAGES.invalidDate,
});

const blockInstant = isoDateTime.transform((value) => new Date(value));

const hasValidDuration = (
  startAt: Date,
  endAt: Date,
  rule: BlockDurationRule,
): boolean => {
  const minutes = (endAt.getTime() - startAt.getTime()) / 60_000;
  return rule === 'exact'
    ? minutes === BLOCK_DURATION_MINUTES
    : minutes % BLOCK_DURATION_MINUTES === 0;
};

export const buildBlockTimeSchema = (
  getNow: () => Date = () => new Date(),
  durationRule: BlockDurationRule = 'multiple',
) =>
  z
    .strictObject({
      startAt: blockInstant,
      endAt: blockInstant,
    })
    .superRefine((payload, ctx) => {
      const { startAt, endAt } = payload;

      if (!(startAt instanceof Date) || !(endAt instanceof Date)) {
        return;
      }

      if (endAt.getTime() <= startAt.getTime()) {
        ctx.addIssue({
          code: 'custom',
          path: ['endAt'],
          message: CREATE_BLOCK_MESSAGES.endBeforeStart,
        });
        return;
      }

      if (!hasValidDuration(startAt, endAt, durationRule)) {
        ctx.addIssue({
          code: 'custom',
          path: ['endAt'],
          message:
            durationRule === 'exact'
              ? CREATE_BLOCK_MESSAGES.invalidBlockDuration
              : CREATE_BLOCK_MESSAGES.invalidRangeDuration,
        });
      }

      if (startAt.getTime() <= getNow().getTime()) {
        ctx.addIssue({
          code: 'custom',
          path: ['startAt'],
          message: CREATE_BLOCK_MESSAGES.startInPast,
        });
      }

      const start = getBoliviaParts(startAt);
      const end = getBoliviaParts(endAt);

      if (!start.isOnStep) {
        ctx.addIssue({
          code: 'custom',
          path: ['startAt'],
          message: CREATE_BLOCK_MESSAGES.invalidStep,
        });
      }
      if (!end.isOnStep) {
        ctx.addIssue({
          code: 'custom',
          path: ['endAt'],
          message: CREATE_BLOCK_MESSAGES.invalidStep,
        });
      }

      if (start.day !== end.day) {
        ctx.addIssue({
          code: 'custom',
          path: ['endAt'],
          message: CREATE_BLOCK_MESSAGES.differentDays,
        });
        return;
      }

      if (start.minutesOfDay < BLOCK_MIN_HOUR * 60) {
        ctx.addIssue({
          code: 'custom',
          path: ['startAt'],
          message: CREATE_BLOCK_MESSAGES.outOfRange,
        });
      }
      if (end.minutesOfDay > BLOCK_MAX_HOUR * 60) {
        ctx.addIssue({
          code: 'custom',
          path: ['endAt'],
          message: CREATE_BLOCK_MESSAGES.outOfRange,
        });
      }
    });
