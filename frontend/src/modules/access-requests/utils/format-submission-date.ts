import { BOLIVIA_MONTH_SHORT_LABELS } from "@/shared/constants/date-time.constants";
import { toBoliviaTime } from "@/shared/utils/date-time";

export function formatSubmissionDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    const { day, month, year, time } = toBoliviaTime(iso);
    return `${day} ${BOLIVIA_MONTH_SHORT_LABELS[month - 1]} ${year}, ${time}`;
  } catch {
    return null;
  }
}
