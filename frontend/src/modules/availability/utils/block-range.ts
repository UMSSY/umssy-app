import { BLOCK_DURATION_MINUTES } from "../constants/availability.constants";
import type { BlockDraftSlot } from "../types/block-draft-slot.types";
import type { CreateAvailabilityBlockInput } from "../types/create-availability-block-input.types";
import { pad } from "./pad";

const MINUTE_MS = 60_000;

export const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const addBlockDuration = (time: string): string => {
  const total = toMinutes(time) + BLOCK_DURATION_MINUTES;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

export const countBlocks = (startTime: string, endTime: string): number => {
  const minutes = toMinutes(endTime) - toMinutes(startTime);
  return minutes > 0 && minutes % BLOCK_DURATION_MINUTES === 0 ? minutes / BLOCK_DURATION_MINUTES : 0;
};

export const splitTimeRange = (startTime: string, endTime: string): string[] =>
  Array.from({ length: countBlocks(startTime, endTime) }, (_, index) => {
    const from = toMinutes(startTime) + index * BLOCK_DURATION_MINUTES;
    const to = from + BLOCK_DURATION_MINUTES;
    return `${pad(Math.floor(from / 60))}:${pad(from % 60)} – ${pad(Math.floor(to / 60))}:${pad(to % 60)}`;
  });

export const splitDraft = (draft: CreateAvailabilityBlockInput | null): BlockDraftSlot[] => {
  if (!draft) return [];
  const start = new Date(draft.startAt).getTime();
  const end = new Date(draft.endAt).getTime();
  const step = BLOCK_DURATION_MINUTES * MINUTE_MS;
  if (end <= start || (end - start) % step !== 0) return [];
  return Array.from({ length: (end - start) / step }, (_, index) => ({
    startAt: new Date(start + index * step).toISOString(),
    endAt: new Date(start + (index + 1) * step).toISOString(),
  }));
};
