import { toBoliviaTime } from "@/shared/utils/date-time";
import { TIME_OPTIONS } from "../constants/availability.constants";
import type { TimeOptionLimits } from "../types/time-option-limits.types";

export const getPastTimeLimit = (date: string, now: Date = new Date()): string | null => {
  const current = toBoliviaTime(now);
  return date === current.date ? current.time : null;
};

const isPast = (time: string, pastLimit: string | null) => pastLimit !== null && time <= pastLimit;

export const isStartTimeDisabled = (time: string, { pastLimit, endTime }: TimeOptionLimits): boolean =>
  time === TIME_OPTIONS[TIME_OPTIONS.length - 1] || isPast(time, pastLimit) || (endTime !== "" && time >= endTime);

export const isEndTimeDisabled = (time: string, { pastLimit, startTime }: TimeOptionLimits): boolean =>
  time === TIME_OPTIONS[0] || isPast(time, pastLimit) || (startTime !== "" && time <= startTime);
