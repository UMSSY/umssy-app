import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { SurveyNotification } from "../types/survey-notification.types";

export const surveyNotificationsService = {
  getNotifications: async (): Promise<SurveyNotification[]> => {
    const { data } = await apiClient.get<ApiResponse<SurveyNotification[]>>("/surveys/notifications");
    return data.data;
  },
};
