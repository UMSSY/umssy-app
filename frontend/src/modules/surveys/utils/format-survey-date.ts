import { SHORT_MONTHS_ES } from "../constants/survey-notifications.constants";

export function formatSurveyDate(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${day} ${SHORT_MONTHS_ES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
