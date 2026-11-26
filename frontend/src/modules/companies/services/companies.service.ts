import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import { resolveApiUrl } from "@/shared/utils/resolve-api-url";
import type { CompanySummary } from "../types/company-summary.types";

export const companiesService = {
  getFeaturedCompanies: async (): Promise<CompanySummary[]> => {
    const response = await apiClient.get<ApiResponse<CompanySummary[]>>("/companies/featured");
    return response.data.data.map((company) => ({ ...company, logoUrl: resolveApiUrl(company.logoUrl) }));
  },
};
