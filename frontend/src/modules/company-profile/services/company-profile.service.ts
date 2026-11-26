import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import { resolveApiUrl } from "@/shared/utils/resolve-api-url";
import type { CompanyProfile } from "../types/company-profile.types";

export const companyProfileService = {
  getProfile: async (companyId: string): Promise<CompanyProfile> => {
    const response = await apiClient.get<ApiResponse<CompanyProfile>>(
      `/companies/${companyId}/profile`,
    );
    const profile = response.data.data;
    return { ...profile, logoUrl: resolveApiUrl(profile.logoUrl) };
  },
};
