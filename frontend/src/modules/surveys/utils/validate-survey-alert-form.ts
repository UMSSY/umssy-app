import { SURVEY_ALERT_THRESHOLD_MAX, SURVEY_ALERT_THRESHOLD_MIN, SURVEY_ALERTS_TEXT } from "../constants/survey-participation.constants";
import type { SurveyAlertFormErrors } from "../types/survey-alert-form-errors.types";
import type { SurveyAlertFormValues } from "../types/survey-alert-form-values.types";

export function getAlertThresholdError(value: string): string | null {
  const trimmed = (value ?? "").trim();
  if (trimmed === "") return SURVEY_ALERTS_TEXT.thresholdRequired;
  if (!/^\d+$/.test(trimmed)) return SURVEY_ALERTS_TEXT.thresholdError;

  const threshold = Number(trimmed);
  if (threshold < SURVEY_ALERT_THRESHOLD_MIN) return SURVEY_ALERTS_TEXT.thresholdMin;
  if (threshold > SURVEY_ALERT_THRESHOLD_MAX) return SURVEY_ALERTS_TEXT.thresholdMax;
  return null;
}

export function parseAlertThreshold(value: string): number | null {
  return getAlertThresholdError(value) === null ? Number(value.trim()) : null;
}

export function validateSurveyAlertForm(values: SurveyAlertFormValues): SurveyAlertFormErrors {
  if (!values.enabled) return {};

  const errors: SurveyAlertFormErrors = {};
  const thresholdError = getAlertThresholdError(values.threshold);
  if (thresholdError) errors.threshold = thresholdError;
  if ((values.questionIds ?? []).length === 0) errors.questions = SURVEY_ALERTS_TEXT.questionsError;
  return errors;
}
