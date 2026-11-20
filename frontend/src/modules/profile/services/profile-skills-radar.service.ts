
import { apiClient } from "@/shared/services/api-client";
import { getAuthHeaders } from "../utils/get-auth-headers";
import type { ApiResponse } from "../types/api-response.types";
import type { ProfileSkillsRadarResponse } from "../types/profile-skills-radar-response.types";

async function analyzeAndGetSkills(): Promise<ProfileSkillsRadarResponse> {
  const response = await apiClient.post<ApiResponse<ProfileSkillsRadarResponse>>(
    "/profile/me/skills/analysis",
    undefined,
    { headers: getAuthHeaders() },
  );
  return response.data.data;
}

export const profileSkillsRadarService = {
  analyzeSkills: async (): Promise<void> => {
    await analyzeAndGetSkills();
  },

  analyzeAndGetSkills,

  getSkills: async (): Promise<ProfileSkillsRadarResponse> => {
    const response = await apiClient.get<
      ApiResponse<ProfileSkillsRadarResponse>
    >("/profile/me/skills/analysis", {
      headers: getAuthHeaders(),
    });

    return response.data.data;
  },
};
