import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import { format } from "date-fns/format";
import { es } from "date-fns/locale/es";


export function formatExpirationDate(date: Date): string {
  return format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
}

export function formatShortExpirationDate(date: Date): string {
  return format(date, "dd/MM/yyyy");
}

export function formatDaysLeft(date: Date, today: Date = new Date()): string {
  const days = differenceInCalendarDays(date, today);
  return days === 1 ? "Falta 1 día" : `Faltan ${days} días`;
}