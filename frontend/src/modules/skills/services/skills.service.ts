import type { DetectedSkillsSummary } from "../types/detected-skills-summary.types";
import type { SkillsRadarResponse } from "../types/skills-radar-response.types";
import { toDetectedSkillsSummary } from "../utils/to-detected-skills-summary";
import { apiClient } from "@/shared/services/api-client";
import {
  CUSTOM_SKILL_ENDPOINT,
  MY_SKILLS_ENDPOINT,
  SKILLS_ANALYSIS_ENDPOINT,
  SKILLS_FOR_RADAR_ENDPOINT,
  SKILLS_CATALOG_ENDPOINT,
} from "../constants/skills.constants";
import type { ApiResponse } from "@/modules/profile";
import type { SkillItem } from "../types/skill-item.types";
import type { SkillResponse } from "../types/skill-response.types";
import { getAuthHeaders } from "@/modules/profile";
import { toSkillItem } from "../utils/to-skill-item";

export const skillsService = {
  getCatalog: async (): Promise<SkillItem[]> => {
    const response = await apiClient.get<ApiResponse<SkillResponse[]>>(SKILLS_CATALOG_ENDPOINT, {
      headers: getAuthHeaders(),
    });
    return (response.data.data ?? []).map(toSkillItem);
  },

  getMySkills: async (): Promise<SkillItem[]> => {
    const response = await apiClient.get<ApiResponse<SkillResponse[]>>(MY_SKILLS_ENDPOINT, {
      headers: getAuthHeaders(),
    });
    return (response.data.data ?? []).map(toSkillItem);
  },

  createCustomSkill: async (name: string): Promise<SkillItem> => {
    const response = await apiClient.post<ApiResponse<SkillResponse>>(
      CUSTOM_SKILL_ENDPOINT,
      { name },
      { headers: getAuthHeaders() },
    );
    return toSkillItem(response.data.data);
  },

  saveMySkills: async (skillIds: string[]): Promise<SkillItem[]> => {
    const response = await apiClient.put<ApiResponse<SkillResponse[]>>(
      MY_SKILLS_ENDPOINT,
      { skillIds },
      { headers: getAuthHeaders() },
    );
    return (response.data.data ?? []).map(toSkillItem);
  },
  getDetectedSkills: async (): Promise<DetectedSkillsSummary> => {
    const response = await apiClient.get<ApiResponse<SkillsRadarResponse>>(SKILLS_FOR_RADAR_ENDPOINT, {
      headers: getAuthHeaders(),
    });
    return toDetectedSkillsSummary(response.data.data);
  },

  analyzeSkills: async (): Promise<DetectedSkillsSummary> => {
    const response = await apiClient.post<ApiResponse<SkillsRadarResponse>>(
      SKILLS_ANALYSIS_ENDPOINT,
      {},
      { headers: getAuthHeaders() },
    );
    return toDetectedSkillsSummary(response.data.data);
  },
};
