import { BOLIVIA_TIME_ZONE } from "@/shared/constants/date-time.constants";

export function getTodayIsoDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BOLIVIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
