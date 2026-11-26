import { ENV_CONFIG } from "@/shared/config/env.config";
import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { CompanyProfile } from "../types/company-profile.types";

function toApiUrl(path: string | null): string | null {
  return path ? `${(ENV_CONFIG.apiUrl ?? "").replace(/\/$/, "")}${path}` : null;
}

export const companyProfileService = {
  getProfile: async (companyId: string): Promise<CompanyProfile> => {
    const response = await apiClient.get<ApiResponse<CompanyProfile>>(
      `/companies/${companyId}/profile`,
    );
    const profile = response.data.data;
    return { ...profile, logoUrl: toApiUrl(profile.logoUrl) };
  },
};
