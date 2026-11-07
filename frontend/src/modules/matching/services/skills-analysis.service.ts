import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { SkillsAnalysisResult } from "../types/skills-analysis.types";

export const skillsAnalysisService = {
  analyzeExperience: async (
    experienceId: string,
    text: string | null,
  ): Promise<SkillsAnalysisResult> => {
    const response = await apiClient.post<ApiResponse<SkillsAnalysisResult>>(
      `/work-experiences/${experienceId}/skills/analysis`,
      { text },
    );

    return response.data.data;
  },

  previewExperience: async (
    experienceId: string,
    text: string | null,
  ): Promise<SkillsAnalysisResult> => {
    const response = await apiClient.post<ApiResponse<SkillsAnalysisResult>>(
      `/work-experiences/${experienceId}/skills/preview`,
      { text },
    );

    return response.data.data;
  },
};