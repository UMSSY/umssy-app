import { toBoliviaTime } from "@/shared/utils/date-time";
import { BLOCK_DURATION_MINUTES, TIME_OPTIONS } from "../constants/availability.constants";
import type { TimeOptionLimits } from "../types/time-option-limits.types";
import { countBlocks, toMinutes } from "./block-range";

export const getPastTimeLimit = (date: string, now: Date = new Date()): string | null => {
  const current = toBoliviaTime(now);
  return date === current.date ? current.time : null;
};

const isPast = (time: string, pastLimit: string | null) => pastLimit !== null && time <= pastLimit;

const LAST_END_MINUTES = toMinutes(TIME_OPTIONS[TIME_OPTIONS.length - 1]);

export const isStartTimeDisabled = (time: string, { pastLimit }: TimeOptionLimits): boolean =>
  toMinutes(time) + BLOCK_DURATION_MINUTES > LAST_END_MINUTES || isPast(time, pastLimit);

export const isEndTimeDisabled = (time: string, { pastLimit, startTime }: TimeOptionLimits): boolean =>
  time === TIME_OPTIONS[0] || isPast(time, pastLimit) || (startTime !== "" && countBlocks(startTime, time) === 0);
