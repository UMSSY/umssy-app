import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import { getJobMatchEndpoint } from "../constants/job-matching.constants";
import type { JobMatch } from "../types/job-match.types";
import type { RecommendationsResult } from "../types/recommendations-result.types";

export const jobMatchingService = {
  getRecommendations: async (): Promise<RecommendationsResult> => {
    const response = await apiClient.get<ApiResponse<RecommendationsResult>>("/job-offers/recommendations");
    return response.data.data;
  },
  getJobMatch: async (jobOfferId: string): Promise<JobMatch> => {
    const response = await apiClient.get<ApiResponse<JobMatch>>(getJobMatchEndpoint(jobOfferId));
    return response.data.data;
  },
};
