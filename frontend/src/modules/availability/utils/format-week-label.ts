import { BOLIVIA_MONTH_LABELS } from "@/shared/constants/date-time.constants";
import type { WeekRange } from "@/shared/types/week-range.types";
import { toBoliviaTime } from "@/shared/utils/date-time";

export function formatWeekLabel(weekRange: WeekRange): string {
  const start = toBoliviaTime(weekRange.startAt);
  const end = toBoliviaTime(weekRange.endAt);
  const startMonth = BOLIVIA_MONTH_LABELS[start.month - 1];
  const endMonth = BOLIVIA_MONTH_LABELS[end.month - 1];

  const endLabel = `${end.day} de ${endMonth} de ${end.year}`;

  if (start.year !== end.year) {
    return `${start.day} de ${startMonth} de ${start.year} – ${endLabel}`;
  }
  if (start.month !== end.month) {
    return `${start.day} de ${startMonth} – ${endLabel}`;
  }
  return `${start.day} – ${end.day} de ${endMonth} de ${end.year}`;
}
