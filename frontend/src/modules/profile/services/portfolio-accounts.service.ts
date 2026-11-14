import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "../types/api-response.types";
import type {
  PortfolioAccountStatusResponse,
  PortfolioConnectedAccountResponse,
  PortfolioOAuthCallbackPayload,
  PortfolioOAuthUrlResponse,
  PortfolioProviderName,
} from "../types/portfolio-account.types";
import { getAuthHeaders } from "../utils/get-auth-headers";

export const portfolioAccountsService = {
  getSocialAccounts: async (): Promise<PortfolioAccountStatusResponse[]> => {
    const response = await apiClient.get<ApiResponse<PortfolioAccountStatusResponse[]>>(
      "/profile/portfolio/accounts",
      { headers: getAuthHeaders() },
    );
    return response.data.data ?? [];
  },

  getOAuthAuthorizationUrl: async (
    provider: PortfolioProviderName,
    state?: string,
  ): Promise<PortfolioOAuthUrlResponse> => {
    const response = await apiClient.get<ApiResponse<PortfolioOAuthUrlResponse>>(
      `/profile/portfolio/oauth/${provider}/url`,
      {
        params: state ? { state } : undefined,
        headers: getAuthHeaders(),
      },
    );
    return response.data.data;
  },

  completeOAuthCallback: async (
    provider: PortfolioProviderName,
    payload: PortfolioOAuthCallbackPayload,
  ): Promise<PortfolioConnectedAccountResponse> => {
    const response = await apiClient.post<ApiResponse<PortfolioConnectedAccountResponse>>(
      `/profile/portfolio/oauth/${provider}/callback`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },
};

