import { apiClient } from "@/shared/services/api-client";
import type { NotificationPreferenceResponse } from "../types/notification-preference-response.types";

type ApiEnvelope<T> = { statusCode: number; ok: boolean; detail: string; data: T };

export const notificationPreferencesService = {
  get: async (): Promise<NotificationPreferenceResponse> => {
    const response = await apiClient.get<ApiEnvelope<NotificationPreferenceResponse>>("/notifications/preferences");
    return response.data.data;
  },

  update: async (preferences: NotificationPreferenceResponse): Promise<void> => {
    await apiClient.put("/notifications/preferences", preferences);
  },
};