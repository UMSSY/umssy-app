export interface CreateAvailabilityBlockInput {
  startAt: string;
  endAt: string;
  repeatWeekly?: boolean;
  repeatUntil?: string;
}
