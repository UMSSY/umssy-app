import { SHORT_MONTH_LABELS } from "@/modules/profile";

const toTwoDigits = (value: number) => String(value).padStart(2, "0");

export function formatUploadDate(date: Date): string {
  const time = `${toTwoDigits(date.getHours())}:${toTwoDigits(date.getMinutes())}`;
  return `${date.getDate()} ${SHORT_MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}, ${time}`;
}
