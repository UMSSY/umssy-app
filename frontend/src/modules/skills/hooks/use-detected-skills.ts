"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DETECTED_SKILLS_QUERY_KEY, SKILLS_ANALYSIS_MUTATION_KEY } from "../constants/skills.constants";
import { skillsService } from "../services/skills.service";
import type { DetectedSkillsSummary } from "../types/detected-skills-summary.types";
import type { UseDetectedSkillsResult } from "../types/use-detected-skills-result.types";

const ANALYSIS_KEY = JSON.stringify(SKILLS_ANALYSIS_MUTATION_KEY);

export function useDetectedSkills(): UseDetectedSkillsResult {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: DETECTED_SKILLS_QUERY_KEY, queryFn: skillsService.getDetectedSkills, refetchInterval: state => state.state.data?.status === 'pending' ? 1500 : false });
  const analysis = useMutation({
    mutationKey: SKILLS_ANALYSIS_MUTATION_KEY,
    mutationFn: skillsService.analyzeSkills,
    onSuccess: (summary) => queryClient.setQueryData<DetectedSkillsSummary>(DETECTED_SKILLS_QUERY_KEY, summary),
  });

  // The backend analyzes the profile after every saved change, so the list is read again after each save.
  useEffect(
    () =>
      queryClient.getMutationCache().subscribe((event) => {
        if (event.type !== "updated" || event.action.type !== "success") return;
        if (JSON.stringify(event.mutation.options.mutationKey) === ANALYSIS_KEY) return;
        void queryClient.invalidateQueries({ queryKey: DETECTED_SKILLS_QUERY_KEY });
      }),
    [queryClient],
  );

  return {
    summary: query.data ?? null,
    isLoading: query.isPending,
    hasLoadError: query.isError || analysis.isError,
    isAnalyzing: analysis.isPending,
    analyze: () => analysis.mutate(),
  };
}
