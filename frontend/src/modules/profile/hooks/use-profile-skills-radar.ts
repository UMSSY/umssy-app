"use client";

import { useQuery } from "@tanstack/react-query";
import { profileSkillsRadarService } from "../services/profile-skills-radar.service";

export const PROFILE_SKILLS_RADAR_QUERY_KEY = [
  "profile",
  "skills-radar",
] as const;

export function useProfileSkillsRadar() {
  return useQuery({
    queryKey: PROFILE_SKILLS_RADAR_QUERY_KEY,
    queryFn: () => profileSkillsRadarService.getSkills(),
  });
}