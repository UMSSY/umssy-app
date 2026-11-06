"use client";

import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PROFILE_SKILLS_RADAR_QUERY_KEY, useProfileSkillsRadar } from "@/modules/profile/hooks/use-profile-skills-radar";
import { profileSkillsRadarService } from "@/modules/profile/services/profile-skills-radar.service";

export function useSkillAnalysis() {
  const queryClient = useQueryClient();
  const query = useProfileSkillsRadar();
  const running = useRef(false);
  const mutation = useMutation({
    mutationFn: () => profileSkillsRadarService.analyzeSkills(),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: PROFILE_SKILLS_RADAR_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["skills", "profile"] });
    },
  });

  async function analyze() {
    if (running.current) return;
    running.current = true;
    try { await mutation.mutateAsync(); }
    catch { /* The mutation exposes failures to the view without hiding them as empty results. */ }
    finally { running.current = false; }
  }

  return { query, mutation, analyze };
}
