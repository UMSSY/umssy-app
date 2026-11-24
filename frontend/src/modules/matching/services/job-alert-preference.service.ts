import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import { JOB_ALERT_PREFERENCE_ENDPOINT } from "../constants/job-alert-preference.constants";
import type { JobAlertMode } from "../types/job-alert-mode.types";
import type { JobAlertPreference } from "../types/job-alert-preference.types";

export const jobAlertPreferenceService = {
  get: async (): Promise<JobAlertPreference> => {
    const response = await apiClient.get<ApiResponse<JobAlertPreference>>(JOB_ALERT_PREFERENCE_ENDPOINT);
    return response.data.data;
  },
  update: async (mode: JobAlertMode): Promise<JobAlertPreference> => {
    const response = await apiClient.put<ApiResponse<JobAlertPreference>>(JOB_ALERT_PREFERENCE_ENDPOINT, { mode });
    return response.data.data;
  },
};
