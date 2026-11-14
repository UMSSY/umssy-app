import type { ApiResponse } from "@/shared/types/api-response.types";
import { SURVEY_ALERT_DEFAULT_THRESHOLD, SURVEY_AUDIENCE_MOCK, SURVEY_PARTICIPATION_TEXT } from "../constants/survey-participation.constants";
import type { SurveyAlertConfig, SurveyAlertConfigPayload } from "../types/survey-alert-config.types";
import type { SurveyAudience } from "../types/survey-audience.types";
import type { SurveyReminderResult } from "../types/survey-reminder-result.types";

// TODO: Reemplazar el almacenamiento en memoria por los endpoints de participación y alertas cuando el backend los publique.
const lastReminders = new Map<string, string>();
const alertConfigs = new Map<string, SurveyAlertConfig>();

function ok<T>(data: T, detail = "Operación exitosa"): ApiResponse<T> {
  return { statusCode: 200, ok: true, detail, data };
}

export const surveyParticipationService = {
  getAudience: async (surveyId: string): Promise<ApiResponse<SurveyAudience>> =>
    ok({
      surveyId,
      totalAudience: SURVEY_AUDIENCE_MOCK.totalAudience,
      audienceLabel: SURVEY_AUDIENCE_MOCK.audienceLabel,
      lastReminderAt: lastReminders.get(surveyId) ?? SURVEY_AUDIENCE_MOCK.lastReminderAt,
    }),

  sendReminder: async (surveyId: string, pendingResponses: number): Promise<ApiResponse<SurveyReminderResult>> => {
    const sentAt = new Date().toISOString();
    lastReminders.set(surveyId, sentAt);
    const message = SURVEY_PARTICIPATION_TEXT.reminderSent(pendingResponses);
    return ok({ sent: true, pendingResponses, message, sentAt }, message);
  },

  getAlertConfig: async (surveyId: string): Promise<ApiResponse<SurveyAlertConfig>> =>
    ok(alertConfigs.get(surveyId) ?? { enabled: true, threshold: SURVEY_ALERT_DEFAULT_THRESHOLD, questionIds: null }),

  saveAlertConfig: async (surveyId: string, payload: SurveyAlertConfigPayload): Promise<ApiResponse<{ saved: boolean }>> => {
    alertConfigs.set(surveyId, { ...payload, questionIds: [...payload.questionIds] });
    return ok({ saved: true });
  },
};
