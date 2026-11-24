import { BOLIVIA_MONTH_SHORT_LABELS } from "@/shared/constants/date-time.constants";
import { CV_CURRENT_PERIOD_LABEL, CV_UNKNOWN_PERIOD_LABEL } from "../constants/cv-extraction.constants";

function formatIsoMonth(value: string | null | undefined): string | null {
  const [year, month] = (value ?? "").split("-");
  const monthLabel = BOLIVIA_MONTH_SHORT_LABELS[Number(month) - 1];
  if (!year) return null;
  return monthLabel ? `${monthLabel} ${year}` : year;
}

export function formatCvPeriod(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  isCurrent = false,
): string {
  const start = formatIsoMonth(startDate);
  const end = isCurrent ? CV_CURRENT_PERIOD_LABEL : formatIsoMonth(endDate);
  if (start && end) return `${start} – ${end}`;
  return start ?? end ?? CV_UNKNOWN_PERIOD_LABEL;
}
