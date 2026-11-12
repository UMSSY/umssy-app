import { SURVEY_ALERT_THRESHOLD_MAX, SURVEY_ALERT_THRESHOLD_MIN, SURVEY_ALERTS_TEXT } from "../constants/survey-participation.constants";
import type { SurveyAlertFormErrors, SurveyAlertFormValues } from "../types/survey-alert-form-errors.types";

export function parseAlertThreshold(value: string): number | null {
  const trimmed = (value ?? "").trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const threshold = Number(trimmed);
  return threshold >= SURVEY_ALERT_THRESHOLD_MIN && threshold <= SURVEY_ALERT_THRESHOLD_MAX ? threshold : null;
}

export function validateSurveyAlertForm(values: SurveyAlertFormValues): SurveyAlertFormErrors {
  if (!values.enabled) return {};

  const errors: SurveyAlertFormErrors = {};
  if (parseAlertThreshold(values.threshold) === null) errors.threshold = SURVEY_ALERTS_TEXT.thresholdError;
  if ((values.questionIds ?? []).length === 0) errors.questions = SURVEY_ALERTS_TEXT.questionsError;
  return errors;
}
