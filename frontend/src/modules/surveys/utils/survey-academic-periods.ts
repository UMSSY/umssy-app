import { toBoliviaTime } from "@/shared/utils/date-time";
import { ALL_ACADEMIC_PERIODS_VALUE } from "../constants/survey-builder.constants";

const YEAR_SUFFIX = /(\d{4})$/;

export function getSurveyYears(today: Date = new Date(), firstYear = 2020): string[] {
  const currentYear = toBoliviaTime(today).year;
  const years: string[] = [];

  for (let year = currentYear; year >= firstYear; year--) {
    years.push(String(year));
  }

  return years;
}

export function toSurveyAcademicPeriod(value: string | null | undefined): string {
  const period = (value ?? "").trim();
  if (!period || period === ALL_ACADEMIC_PERIODS_VALUE) return period;
  return YEAR_SUFFIX.exec(period)?.[1] ?? "";
}

export function matchesSurveyYear(period: string | null | undefined, year: string): boolean {
  if (!period || period === ALL_ACADEMIC_PERIODS_VALUE) return false;
  return toSurveyAcademicPeriod(period) === year;
}
