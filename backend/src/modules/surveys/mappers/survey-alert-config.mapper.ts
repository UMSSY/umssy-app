import type { SurveyAlertConfig } from '../../../prisma/client.js';
import { SURVEY_ALERT_CONFIG_DEFAULTS } from '../constants/survey-alert-config.constants.js';
import type { SurveyAlertConfigResponse } from '../responses/survey-alert-config.response.js';
import type { SurveyAlertConfigSavedResponse } from '../responses/survey-alert-config-saved.response.js';
import { toQuestionIds } from '../utils/to-question-ids.js';

export function toSurveyAlertConfigResponse(
  config: SurveyAlertConfig | null,
): SurveyAlertConfigResponse {
  if (!config) {
    return {
      enabled: SURVEY_ALERT_CONFIG_DEFAULTS.enabled,
      threshold: SURVEY_ALERT_CONFIG_DEFAULTS.threshold,
      questionIds: null,
    };
  }
  return {
    enabled: config.isEnabled,
    threshold: config.threshold,
    questionIds: toQuestionIds(config.questionIds),
  };
}

export function toSurveyAlertConfigSavedResponse(
  config: SurveyAlertConfig,
): SurveyAlertConfigSavedResponse {
  return { saved: true, ...toSurveyAlertConfigResponse(config) };
}
