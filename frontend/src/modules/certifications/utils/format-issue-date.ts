import { BOLIVIA_MONTH_SHORT_LABELS } from "@/shared/constants/date-time.constants";

export function formatIssueDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  const monthLabel = BOLIVIA_MONTH_SHORT_LABELS[Number(month) - 1];
  return `${Number(day)} ${monthLabel} ${year}`;
}
