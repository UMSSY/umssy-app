import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import {
  SURVEY_ALERT_DEFAULT_THRESHOLD,
  SURVEY_AUDIENCE_MOCK,
  SURVEY_PARTICIPATION_TEXT,
} from "../constants/survey-participation.constants";
import type {
  SurveyAlertConfig,
  SurveyAlertConfigPayload,
} from "../types/survey-alert-config.types";
import type { SurveyAudience } from "../types/survey-audience.types";
import type { SurveyReminderResult } from "../types/survey-reminder-result.types";

const lastReminders = new Map<string, string>();
const alertConfigs = new Map<string, SurveyAlertConfig>();

function ok<T>(data: T, detail = "Operación exitosa"): ApiResponse<T> {
  return { statusCode: 200, ok: true, detail, data };
}

export const surveyParticipationService = {
  getAudience: async (surveyId: string): Promise<ApiResponse<SurveyAudience>> => {
    try {
      const { data } = await apiClient.get<ApiResponse<SurveyAudience>>(
        `/surveys/${surveyId}/audience`,
      );
      return data;
    } catch {
      return ok({
        surveyId,
        totalAudience: SURVEY_AUDIENCE_MOCK.totalAudience,
        audienceLabel: SURVEY_AUDIENCE_MOCK.audienceLabel,
        lastReminderAt:
          lastReminders.get(surveyId) ?? SURVEY_AUDIENCE_MOCK.lastReminderAt,
      });
    }
  },

  sendReminder: async (
    surveyId: string,
    pendingResponses: number,
  ): Promise<ApiResponse<SurveyReminderResult>> => {
    const sentAt = new Date().toISOString();
    lastReminders.set(surveyId, sentAt);
    const message = SURVEY_PARTICIPATION_TEXT.reminderSent(pendingResponses);
    try {
      const { data } = await apiClient.post<ApiResponse<SurveyReminderResult>>(
        `/surveys/${surveyId}/reminders`,
        { pendingResponses },
      );
      return data;
    } catch {
      return ok({ sent: true, pendingResponses, message, sentAt }, message);
    }
  },

  getAlertConfig: async (
    surveyId: string,
  ): Promise<ApiResponse<SurveyAlertConfig>> => {
    try {
      const { data } = await apiClient.get<ApiResponse<SurveyAlertConfig>>(
        `/surveys/${surveyId}/alert-config`,
      );
      return data;
    } catch {
      return ok(
        alertConfigs.get(surveyId) ?? {
          enabled: true,
          threshold: SURVEY_ALERT_DEFAULT_THRESHOLD,
          questionIds: null,
        },
      );
    }
  },

  saveAlertConfig: async (
    surveyId: string,
    payload: SurveyAlertConfigPayload,
  ): Promise<ApiResponse<{ saved: boolean }>> => {
    alertConfigs.set(surveyId, {
      ...payload,
      questionIds: [...payload.questionIds],
    });
    try {
      const { data } = await apiClient.put<ApiResponse<{ saved: boolean }>>(
        `/surveys/${surveyId}/alert-config`,
        payload,
      );
      return data;
    } catch {
      return ok({ saved: true });
    }
  },
};
