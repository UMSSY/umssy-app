import { AVAILABILITY_TOAST_TEXT } from "../constants/availability-toast.constants";
import type { WeeklyRepeatResponse } from "../types/weekly-repeat-response.types";
import type { WeeklyRepeatToast } from "../types/weekly-repeat-toast.types";

export function buildWeeklyRepeatToast(result: WeeklyRepeatResponse): WeeklyRepeatToast {
  const title =
    result.created === 0
      ? AVAILABILITY_TOAST_TEXT.noBlocksCreated
      : result.created === 1
        ? "Se creó 1 bloque."
        : `Se crearon ${result.created} bloques.`;

  const description =
    result.skipped.length > 0
      ? `${AVAILABILITY_TOAST_TEXT.skippedDatesLabel} ${result.skipped.join(", ")}`
      : undefined;

  return { title, description };
}
