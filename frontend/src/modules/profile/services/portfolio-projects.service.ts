import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "../types/api-response.types";
import type {
  ExternalRepositoryItem,
  PortfolioProjectItem,
  UpdatePortfolioProjectsPayload,
} from "../types/portfolio-project.types";
import type { PortfolioProviderName } from "../types/portfolio-provider-name.types";
import { getAuthHeaders } from "../utils/get-auth-headers";

export const portfolioProjectsService = {
  getPortfolioProjects: async (): Promise<PortfolioProjectItem[]> => {
    const response = await apiClient.get<ApiResponse<PortfolioProjectItem[]>>(
      "/profile/portfolio/projects",
      { headers: getAuthHeaders() },
    );
    return response.data.data ?? [];
  },

  updatePortfolioProjects: async (
    payload: UpdatePortfolioProjectsPayload,
  ): Promise<PortfolioProjectItem[]> => {
    const response = await apiClient.put<ApiResponse<PortfolioProjectItem[]>>(
      "/profile/portfolio/projects",
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data ?? [];
  },

  getAvailableRepositories: async (
    provider?: PortfolioProviderName,
  ): Promise<ExternalRepositoryItem[]> => {
    const response = await apiClient.get<ApiResponse<ExternalRepositoryItem[]>>(
      "/profile/portfolio/repositories",
      {
        headers: getAuthHeaders(),
        params: provider ? { provider } : undefined,
      },
    );
    return response.data.data ?? [];
  },

  syncPortfolioProjects: async (): Promise<PortfolioProjectItem[]> => {
    const response = await apiClient.post<ApiResponse<PortfolioProjectItem[]>>(
      "/profile/portfolio/projects/sync",
      {},
      { headers: getAuthHeaders() },
    );
    return response.data.data ?? [];
  },
};

