import { BOLIVIA_TIME_ZONE } from "@/shared/constants/date-time.constants";
import { OFFLINE_PASSES_LOCALE } from "../constants/offline-passes.constants";

const formatter = new Intl.DateTimeFormat(OFFLINE_PASSES_LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: BOLIVIA_TIME_ZONE,
});

export function formatLastUpdated(savedAt: string): string | null {
  const time = Date.parse(savedAt);
  return Number.isNaN(time) ? null : formatter.format(time);
}
