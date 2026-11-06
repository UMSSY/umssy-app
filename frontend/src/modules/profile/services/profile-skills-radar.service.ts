
import { apiClient } from "@/shared/services/api-client";
import { getAuthHeaders } from "@/modules/profile";
import type { ApiResponse } from "../types/api-response.types";
import type { ProfileSkillsRadarResponse } from "../types/profile-skills-radar-response.types";
import type { ProfileSkillsAnalysisResponse } from "../types/profile-skills-analysis-response.types";

export const profileSkillsRadarService = {
  analyzeSkills: async (): Promise<ProfileSkillsAnalysisResponse> => {
    const response = await apiClient.post<ApiResponse<ProfileSkillsAnalysisResponse>>(
      "/profile/me/skills/analysis",
      undefined,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
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
