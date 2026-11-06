import type { AvailabilityBlock } from "../types/availability-block.types";
import type { WeeklyRepeatResponse } from "../types/weekly-repeat-response.types";

export function isWeeklyRepeatResponse(
  result: AvailabilityBlock | WeeklyRepeatResponse,
): result is WeeklyRepeatResponse {
  return "created" in result;
}
