import { toBoliviaTime } from "@/shared/utils/date-time";

const pad = (value: number): string => String(value).padStart(2, "0");

// La fecha de publicación se muestra en hora de Bolivia con el formato DD/MM/AAAA.
export function formatPublicationDate(isoDate: string): string {
  const { day, month, year } = toBoliviaTime(isoDate);
  return `${pad(day)}/${pad(month)}/${year}`;
}
