import { format, isValid, parse } from "date-fns";
import { toBoliviaTime, toUtcIso } from "@/shared/utils/date-time";

const DATE_VALUE_FORMAT = "yyyy-MM-dd";
const DISPLAY_FORMAT = "dd/MM/yyyy";
const END_OF_MINUTE_MS = 59_999;

export function getBoliviaTodayValue(now: Date = new Date()): string {
  return toBoliviaTime(now).date;
}

export function toCalendarDate(value: string): Date | undefined {
  if (!value) return undefined;
  const date = parse(value, DATE_VALUE_FORMAT, new Date());
  return isValid(date) ? date : undefined;
}

export function toDateValue(date: Date): string {
  return format(date, DATE_VALUE_FORMAT);
}

export function formatDisplayDate(value: string): string {
  const date = toCalendarDate(value);
  return date ? format(date, DISPLAY_FORMAT) : "";
}

export function formatIsoDisplayDate(iso: string | null): string {
  if (!iso) return "";
  return formatDisplayDate(toBoliviaTime(iso).date);
}

export function toOpensAtIso(value: string): string {
  return toUtcIso(value, "00:00");
}

export function toClosesAtIso(value: string): string {
  const lastMinute = new Date(toUtcIso(value, "23:59")).getTime();
  return new Date(lastMinute + END_OF_MINUTE_MS).toISOString();
}
