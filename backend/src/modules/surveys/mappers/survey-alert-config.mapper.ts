import type { Prisma } from '../../../prisma/client.js';
import type { SurveyAlertConfigResponse } from '../responses/survey-alert-config.response.js';
import type { SurveyAlertConfigSavedResponse } from '../responses/survey-alert-config-saved.response.js';

export type SurveyAlertConfigRecord = Prisma.SurveyAlertConfigGetPayload<{}>;

export function toSurveyAlertConfigResponse(
  config: SurveyAlertConfigRecord | null,
): SurveyAlertConfigResponse {
  if (!config) {
    return {
      enabled: true,
      threshold: 10,
      questionIds: null,
    };
  }
  return {
    enabled: config.isEnabled,
    threshold: config.threshold,
    questionIds: (config.questionIds as string[] | null) ?? null,
  };
}

export function toSurveyAlertConfigSavedResponse(
  config: SurveyAlertConfigRecord,
): SurveyAlertConfigSavedResponse {
  return {
    saved: true,
    ...toSurveyAlertConfigResponse(config),
  };
}
