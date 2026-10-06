import { apiClient } from "@/shared/services/api-client";

export const homeService = {
  getWelcomeMessage: async (): Promise<string> => {
    const response = await apiClient.get<string>("/");
    return response.data;
  },
};