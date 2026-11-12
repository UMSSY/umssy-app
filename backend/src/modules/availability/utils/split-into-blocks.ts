import { MINUTE_MS } from '../../../common/constants/date-time.constants.js';
import { BLOCK_DURATION_MINUTES } from '../constants/create-block.constants.js';
import type { BlockSlot } from '../types/block-slot.types.js';

export const splitIntoBlocks = (startAt: Date, endAt: Date): BlockSlot[] => {
  const durationMs = BLOCK_DURATION_MINUTES * MINUTE_MS;
  const slots: BlockSlot[] = [];

  for (
    let start = startAt.getTime();
    start + durationMs <= endAt.getTime();
    start += durationMs
  ) {
    slots.push({
      startAt: new Date(start),
      endAt: new Date(start + durationMs),
    });
  }

  return slots;
};
