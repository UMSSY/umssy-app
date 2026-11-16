import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "../types/api-response.types";
import type { PortfolioAccountDisconnectResponse } from "../types/portfolio-account-disconnect-response.types";
import type { PortfolioAccountStatusResponse } from "../types/portfolio-account-status-response.types";
import type { PortfolioConnectedAccountResponse } from "../types/portfolio-connected-account-response.types";
import type { PortfolioOAuthCallbackPayload } from "../types/portfolio-oauth-callback-payload.types";
import type { PortfolioOAuthUrlResponse } from "../types/portfolio-oauth-url-response.types";
import type { PortfolioProviderName } from "../types/portfolio-provider-name.types";
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

  disconnectSocialAccount: async (
    provider: PortfolioProviderName,
  ): Promise<PortfolioAccountDisconnectResponse> => {
    const response = await apiClient.delete<ApiResponse<PortfolioAccountDisconnectResponse>>(
      `/profile/portfolio/accounts/${provider}`,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },
};

