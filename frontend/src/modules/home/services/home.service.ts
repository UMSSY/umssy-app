import { apiClient } from "@/shared/services/api-client";
import type { ApiEnvelope } from "@/shared/types/api-envelope";

export const homeService = {
  getWelcomeMessage: async (): Promise<string> => {
    const response = await apiClient.get<ApiEnvelope<string>>("/");
    return response.data.data;
  },
};