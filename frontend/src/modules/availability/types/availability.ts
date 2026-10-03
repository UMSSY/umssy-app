export type AvailabilityBlockState = "free" | "pending" | "confirmed";

export interface AvailabilityBlock {
  id: string;
  mentorId: string;
  startAt: string;
  endAt: string;
  state: AvailabilityBlockState;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAvailabilityBlockInput {
  startAt: string;
  endAt: string;
}

export interface AvailabilityFilters {
  from?: string;
  to?: string;
}
