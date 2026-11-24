"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { JOB_OFFERS_QUERY_KEYS } from "../constants/job-offers-query-keys.constants";
import { REQUIREMENTS_DETECTION_DEBOUNCE_MS } from "../constants/job-offers.constants";
import { jobOffersService } from "../services/job-offers.service";
import type { RequirementsSkillsPreview } from "../types/requirements-skills-preview.types";
import type { SkillOption } from "../types/skill-option.types";

const NO_SKILLS: SkillOption[] = [];

async function detectRequirementSkills(text: string): Promise<RequirementsSkillsPreview> {
  const startedAt = performance.now();
  const skills = await jobOffersService.detectRequirementSkills(text);
  return { skills, processingTimeMs: Math.round(performance.now() - startedAt) };
}

export function useRequirementsSkillsPreview(description: string) {
  const text = description.trim();
  const [debouncedText, setDebouncedText] = useState("");

  useEffect(() => {
    if (!text) return;

    const timeoutId = window.setTimeout(() => setDebouncedText(text), REQUIREMENTS_DETECTION_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [text]);

  const query = useQuery({
    queryKey: JOB_OFFERS_QUERY_KEYS.requirementSkills(text),
    queryFn: () => detectRequirementSkills(text),
    enabled: Boolean(text) && debouncedText === text,
    placeholderData: (previousData) => previousData,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    detectedSkills: text ? (query.data?.skills ?? NO_SKILLS) : NO_SKILLS,
    processingTimeMs: text ? query.data?.processingTimeMs : undefined,
    isAnalyzing: Boolean(text) && query.isFetching,
    isError: Boolean(text) && query.isError,
  };
}
