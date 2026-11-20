import { toBoliviaTime } from "@/shared/utils/date-time";

const pad = (value: number): string => String(value).padStart(2, "0");

export function formatPublicationDate(isoDate: string): string {
  const { day, month, year } = toBoliviaTime(isoDate);
  return `${pad(day)}/${pad(month)}/${year}`;
}
