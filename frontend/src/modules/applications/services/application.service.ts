import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import {
  getApplicationContactEndpoint,
  getReactivateApplicationEndpoint,
  getWithdrawApplicationEndpoint,
} from "../constants/application.constants";
import type { Application } from "../types/application.types";
import type { ApplicationContact } from "../types/application-contact.types";

export const applicationService = {
  getMine: async (): Promise<Application[]> => {
    const response = await apiClient.get<ApiResponse<Application[]>>("/applications/me");
    return response.data.data;
  },
  withdraw: async (applicationId: string): Promise<void> => {
    await apiClient.patch(getWithdrawApplicationEndpoint(applicationId));
  },
  reactivate: async (applicationId: string): Promise<void> => {
    await apiClient.patch(getReactivateApplicationEndpoint(applicationId));
  },
  getContact: async (applicationId: string): Promise<ApplicationContact> => {
    const response = await apiClient.get<ApiResponse<ApplicationContact>>(getApplicationContactEndpoint(applicationId));
    return response.data.data;
  },
};
