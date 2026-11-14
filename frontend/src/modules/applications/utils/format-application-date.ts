import { BOLIVIA_TIME_ZONE } from "@/shared/constants/date-time.constants";

const applicationDateFormatter = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: BOLIVIA_TIME_ZONE,
});

export function formatApplicationDate(appliedDate: string): string {
  return applicationDateFormatter.format(new Date(appliedDate));
}
