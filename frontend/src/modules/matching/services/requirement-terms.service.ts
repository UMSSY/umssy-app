import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import { REQUIREMENT_TERMS_ENDPOINT } from "../constants/requirement-analysis.constants";
import type { RequirementTermsResult } from "../types/requirement-terms.types";

export const requirementTermsService = {
  analyze: async (text: string): Promise<RequirementTermsResult> => {
    const response = await apiClient.post<ApiResponse<RequirementTermsResult>>(
      REQUIREMENT_TERMS_ENDPOINT,
      { text },
    );
    return response.data.data;
  },
};
