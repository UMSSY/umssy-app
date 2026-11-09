import { BOLIVIA_TIME_ZONE } from "@/shared/constants/date-time.constants";
import type { AcademicPeriod } from "../types/registered-user.types";

const YEAR_MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: BOLIVIA_TIME_ZONE,
  year: "numeric",
  month: "numeric",
});

export function getAcademicPeriods(today = new Date(), firstYear = 2020): AcademicPeriod[] {
  const parts = YEAR_MONTH_FORMATTER.formatToParts(today);
  const currentYear = Number(parts.find((part) => part.type === "year")?.value);
  const currentMonth = Number(parts.find((part) => part.type === "month")?.value);
  const isSecondSemester = currentMonth > 6;
  const periods: AcademicPeriod[] = [];

  for (let year = currentYear; year >= firstYear; year--) {
    if (year < currentYear || isSecondSemester) {
      periods.push(`II-${year}`);
    }
    periods.push(`I-${year}`);
  }

  return periods;
}
