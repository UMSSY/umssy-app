import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import { APPLICATIONS_ENDPOINT, getWithdrawApplicationEndpoint } from "../constants/application.constants";
import type { Application } from "../types/application.types";

export const applicationService = {
  getMine: async (): Promise<Application[]> => {
    const response = await apiClient.get<ApiResponse<Application[]>>(APPLICATIONS_ENDPOINT);
    return response.data.data;
  },
  withdraw: async (applicationId: string): Promise<void> => {
    await apiClient.patch(getWithdrawApplicationEndpoint(applicationId));
  },
};
