import { SURVEY_RESPONSE_RATE_THRESHOLDS } from "../constants/survey-participation.constants";
import type { SurveyResponseRateTone } from "../types/survey-response-rate-tone.types";

export function getResponseRateTone(responseRate: number): SurveyResponseRateTone {
  const rate = Number.isFinite(responseRate) ? responseRate : 0;
  if (rate <= SURVEY_RESPONSE_RATE_THRESHOLDS.dangerMax) return "danger";
  if (rate <= SURVEY_RESPONSE_RATE_THRESHOLDS.warningMax) return "warning";
  return "success";
}
