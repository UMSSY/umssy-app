import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { SurveyAlertConfigPayload } from "../types/survey-alert-config-payload.types";
import type { SurveyAlertConfigSaved } from "../types/survey-alert-config-saved.types";
import type { SurveyAlertConfig } from "../types/survey-alert-config.types";
import type { SurveyParticipation } from "../types/survey-participation.types";
import type { SurveyReminderResult } from "../types/survey-reminder-result.types";

export const surveyParticipationService = {
  getParticipation: async (surveyId: string): Promise<ApiResponse<SurveyParticipation>> => {
    const { data } = await apiClient.get<ApiResponse<SurveyParticipation>>(`/surveys/${surveyId}/participation`);
    return data;
  },

  sendReminders: async (surveyId: string): Promise<ApiResponse<SurveyReminderResult>> => {
    const { data } = await apiClient.post<ApiResponse<SurveyReminderResult>>(`/surveys/${surveyId}/reminders`, {});
    return data;
  },

  getAlertConfig: async (surveyId: string): Promise<ApiResponse<SurveyAlertConfig>> => {
    const { data } = await apiClient.get<ApiResponse<SurveyAlertConfig>>(`/surveys/${surveyId}/alert-config`);
    return data;
  },

  saveAlertConfig: async (
    surveyId: string,
    payload: SurveyAlertConfigPayload,
  ): Promise<ApiResponse<SurveyAlertConfigSaved>> => {
    const { data } = await apiClient.put<ApiResponse<SurveyAlertConfigSaved>>(`/surveys/${surveyId}/alert-config`, payload);
    return data;
  },
};
