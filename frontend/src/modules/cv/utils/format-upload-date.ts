import { BOLIVIA_MONTH_SHORT_LABELS } from "@/shared/constants/date-time.constants";

const toTwoDigits = (value: number) => String(value).padStart(2, "0");

export function formatUploadDate(date: Date): string {
  const time = `${toTwoDigits(date.getHours())}:${toTwoDigits(date.getMinutes())}`;
  return `${date.getDate()} ${BOLIVIA_MONTH_SHORT_LABELS[date.getMonth()]} ${date.getFullYear()}, ${time}`;
}
