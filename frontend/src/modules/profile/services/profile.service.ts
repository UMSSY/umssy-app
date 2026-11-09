import { apiClient } from "@/shared/services/api-client";

import type { ApiResponse } from "../types/api-response.types";
import type { CityOption } from "../types/city-option.types";
import type { PersonalInfoValues } from "../types/personal-info-values.types";
import type { PresentationPayload } from "../types/presentation-payload.types";
import type { ProfileResponse } from "../types/profile-response.types";
import { getAuthHeaders } from "../utils/get-auth-headers";

export const profileService = {
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ApiResponse<ProfileResponse>>("/profile/me", {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  getCities: async (): Promise<CityOption[]> => {
    const response = await apiClient.get<ApiResponse<CityOption[]>>("/profile/cities", {
      headers: getAuthHeaders(),
    });
    return response.data.data ?? [];
  },

  updatePersonalInfo: async (values: PersonalInfoValues): Promise<ProfileResponse> => {
    const response = await apiClient.patch<ApiResponse<ProfileResponse>>(
      "/profile/me/personal-info",
      values,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  updatePresentation: async (payload: PresentationPayload): Promise<ProfileResponse> => {
    const response = await apiClient.patch<ApiResponse<ProfileResponse>>(
      "/profile/me/presentation",
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },
};
