import { SURVEY_ALERT_THRESHOLD_MAX_LENGTH } from "../constants/survey-participation.constants";

export function sanitizeAlertThreshold(value: string): string {
  return (value ?? "").replace(/\D/g, "").slice(0, SURVEY_ALERT_THRESHOLD_MAX_LENGTH);
}
