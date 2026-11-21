import { toBoliviaTime } from "@/shared/utils/date-time";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

function toDayNumber(value: Date | string): number {
  const [year, month, day] = toBoliviaTime(value).date.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

function plural(amount: number, singular: string, pluralWord: string): string {
  return `${amount} ${amount === 1 ? singular : pluralWord}`;
}

// Devuelve cuánto tiempo lleva publicada la vacante (días, meses o años) usando días de Bolivia.
export function formatOpenTime(publishedAt: string, now: Date = new Date()): string {
  const days = Math.max(0, toDayNumber(now) - toDayNumber(publishedAt));

  if (days === 0) return "Hoy";
  if (days < DAYS_PER_MONTH) return `Hace ${plural(days, "día", "días")}`;
  if (days < DAYS_PER_YEAR) return `Hace ${plural(Math.floor(days / DAYS_PER_MONTH), "mes", "meses")}`;
  return `Hace ${plural(Math.floor(days / DAYS_PER_YEAR), "año", "años")}`;
}
