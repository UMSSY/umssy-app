import { BOLIVIA_MONTH_LABELS } from "@/shared/constants/date-time.constants";
import { toBoliviaTime } from "@/shared/utils/date-time";

function parseBoliviaTime(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    return toBoliviaTime(iso);
  } catch {
    return null;
  }
}

export function formatLongDate(iso: string | null | undefined): string | null {
  const time = parseBoliviaTime(iso);
  if (!time) return null;
  return `${time.day} de ${BOLIVIA_MONTH_LABELS[time.month - 1]} de ${time.year}, ${time.time}`;
}

export function formatShortDate(iso: string | null | undefined): string | null {
  const time = parseBoliviaTime(iso);
  if (!time) return null;
  return `${time.day} ${BOLIVIA_MONTH_LABELS[time.month - 1].slice(0, 3)}, ${time.time}`;
}
