import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import { getWithdrawApplicationEndpoint } from "../constants/application.constants";
import type { Application } from "../types/application.types";
import type { ApplicationConsents } from "../types/application-consents.types";

export const applicationService = {
  getConsents: async (id: string): Promise<ApplicationConsents> => {
    const response = await apiClient.get<ApiResponse<ApplicationConsents[]>>("/radar-integration/me/applications");
    const application = response.data.data.find((item) => item.id === id);
    if (!application) throw new Error("Postulación no disponible");
    return application;
  },
  updateConsents: async ({ id, consent, consentCv, consentContact }: ApplicationConsents): Promise<ApplicationConsents> => {
    const response = await apiClient.patch<ApiResponse<ApplicationConsents>>(
      `/radar-integration/me/applications/${id}/consents`, { consent, consentCv, consentContact },
    );
    return response.data.data;
  },
  getMine: async (): Promise<Application[]> => {
    const response = await apiClient.get<ApiResponse<Application[]>>("/applications/me");
    return response.data.data;
  },
  withdraw: async (applicationId: string): Promise<void> => {
    await apiClient.patch(getWithdrawApplicationEndpoint(applicationId));
  },
};
