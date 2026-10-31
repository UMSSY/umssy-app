
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  skillsAnalysisService,
  type SkillsAnalysisResult,
} from "@/modules/matching";
import { profileSkillsRadarService } from "@/modules/profile";
import { PROFILE_SKILLS_RADAR_QUERY_KEY } from "@/modules/profile";
import { WORK_EXPERIENCE_FEEDBACK_MESSAGES } from "../config/work-experience-feedback.config";
import { workExperienceService } from "../services/work-experience.service";
import type { Feedback } from "@/modules/profile";
import type { WorkExperienceItem } from "../types/work-experience-item.types";
import type { WorkExperiencePayload } from "../types/work-experience-payload.types";

const SKILLS_PROFILE_QUERY_KEY = ["skills", "profile"] as const;

export function useSaveWorkExperience(onSaved: () => void) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: () => Promise<WorkExperienceItem>) => request(),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [analysis, setAnalysis] = useState<SkillsAnalysisResult | null>(null);

  async function refreshSkills(): Promise<void> {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: SKILLS_PROFILE_QUERY_KEY,
      }),
      queryClient.invalidateQueries({
        queryKey: PROFILE_SKILLS_RADAR_QUERY_KEY,
      }),
    ]);
  }

  async function analyze(
    saved: WorkExperienceItem,
    payload: WorkExperiencePayload,
  ): Promise<void> {
    setIsAnalyzing(true);

    try {
      try {
        const result = await skillsAnalysisService.analyzeExperience(
          saved.id,
          payload.description,
        );

        setAnalysis(result);
      } catch {
        setAnalysis(null);
      }

      try {
        await profileSkillsRadarService.analyzeSkills();
      } catch {
      }

      await refreshSkills();
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function save(
    payload: WorkExperiencePayload,
    id?: string,
  ): Promise<void> {
    setIsSaving(true);
    setFeedback(null);
    setAnalysis(null);

    try {
      const saved = id
        ? await mutation.mutateAsync(() =>
            workExperienceService.updateWorkExperience(id, payload),
          )
        : await mutation.mutateAsync(() =>
            workExperienceService.createWorkExperience(payload),
          );

      setFeedback({
        type: "success",
        message: id
          ? WORK_EXPERIENCE_FEEDBACK_MESSAGES.updateSuccess
          : WORK_EXPERIENCE_FEEDBACK_MESSAGES.createSuccess,
      });

      onSaved();

      // El análisis se ejecuta en segundo plano sin invalidar el guardado.
      void analyze(saved, payload);
    } catch {
      setFeedback({
        type: "error",
        message: id
          ? WORK_EXPERIENCE_FEEDBACK_MESSAGES.updateError
          : WORK_EXPERIENCE_FEEDBACK_MESSAGES.createError,
      });
    } finally {
      setIsSaving(false);
    }
  }

  function clearFeedback() {
    setFeedback(null);
    setAnalysis(null);
  }

  return {
    save,
    isSaving,
    isAnalyzing,
    analysis,
    feedback,
    clearFeedback,
  };
}
