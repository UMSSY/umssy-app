import { SURVEY_RESPONSE_RATE_LEVEL_THRESHOLDS } from "../constants/survey-participation.constants";
import type { SurveyResponseRateLevel } from "../types/survey-response-rate-level.types";

export function getResponseRateLevel(responseRate: number): SurveyResponseRateLevel {
  const rate = Number.isFinite(responseRate) ? responseRate : 0;
  if (rate <= SURVEY_RESPONSE_RATE_LEVEL_THRESHOLDS.lowMax) return "low";
  if (rate <= SURVEY_RESPONSE_RATE_LEVEL_THRESHOLDS.mediumMax) return "medium";
  return "expected";
}
