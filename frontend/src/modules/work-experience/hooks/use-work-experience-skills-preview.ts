"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { skillsAnalysisService } from "@/modules/matching";

import type { WorkExperienceSkillsPreviewOptions } from "../types/work-experience-skills-preview-options.types";

export function useWorkExperienceSkillsPreview({
  experienceId,
  description,
  initialSkills = [],
}: WorkExperienceSkillsPreviewOptions) {
  const text = description.trim();
  const [debouncedInput, setDebouncedInput] = useState<
    Pick<WorkExperienceSkillsPreviewOptions, "experienceId" | "description"> | null
  >(null);

  useEffect(() => {
    if (!experienceId || !text) return;

    const timeoutId = window.setTimeout(() => {
      setDebouncedInput({ experienceId, description: text });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [experienceId, text]);

  const query = useQuery({
    queryKey: ["work-experience-skills-preview", experienceId, text],
    queryFn: experienceId && text
      ? () => skillsAnalysisService.previewExperience(experienceId, text)
      : skipToken,
    enabled: Boolean(
      experienceId && text &&
      debouncedInput?.experienceId === experienceId &&
      debouncedInput.description === text,
    ),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === experienceId ? previousData : undefined,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    detectedSkills: text ? query.data?.skills ?? initialSkills : [],
    processingTimeMs: text ? query.data?.processingTimeMs : undefined,
    isAnalyzing: Boolean(text) && query.isFetching,
    isError: query.isError,
  };
}
