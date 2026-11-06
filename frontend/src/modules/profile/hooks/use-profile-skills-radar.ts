"use client";

import { useQuery } from "@tanstack/react-query";
import { PROFILE_SKILLS_RADAR_QUERY_KEY } from "../constants/profile-skills-query.constants";
import { profileSkillsRadarService } from "../services/profile-skills-radar.service";

export { PROFILE_SKILLS_RADAR_QUERY_KEY } from "../constants/profile-skills-query.constants";

export function useProfileSkillsRadar() {
  return useQuery({
    queryKey: PROFILE_SKILLS_RADAR_QUERY_KEY,
    queryFn: () => profileSkillsRadarService.getSkills(),
  });
}
