
import { apiClient } from "@/shared/services/api-client";
import { getAuthHeaders } from "@/modules/profile";
import type { ApiResponse } from "../types/api-response.types";
import type { ProfileSkillsRadarResponse } from "../types/profile-skills-radar-response.types";

export const profileSkillsRadarService = {
  analyzeSkills: async (): Promise<void> => {
    await apiClient.post<ApiResponse<unknown>>(
      "/profile/me/skills/analysis",
      undefined,
      { headers: getAuthHeaders() },
    );
  },

  getSkills: async (): Promise<ProfileSkillsRadarResponse> => {
    const response = await apiClient.get<
      ApiResponse<ProfileSkillsRadarResponse>
    >("/profile/skills-for-radar", {
      headers: getAuthHeaders(),
    });

    return response.data.data;
  },
};
