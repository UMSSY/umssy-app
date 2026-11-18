import { format } from "date-fns/format";
import { toUtcIso } from "@/shared/utils/date-time";

export function toExpiresAtIso(date: Date): string {
  return toUtcIso(format(date, "yyyy-MM-dd"), "23:59");
}