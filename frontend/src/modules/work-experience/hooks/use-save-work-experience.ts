"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PROFILE_SKILLS_RADAR_QUERY_KEY } from "@/modules/profile";
import type { Feedback } from "@/modules/profile";
import { WORK_EXPERIENCE_FEEDBACK_MESSAGES } from "../config/work-experience-feedback.config";
import { workExperienceService } from "../services/work-experience.service";
import type { WorkExperienceItem } from "../types/work-experience-item.types";
import type { WorkExperiencePayload } from "../types/work-experience-payload.types";

const SKILLS_PROFILE_QUERY_KEY = ["skills", "profile"] as const;

export function useSaveWorkExperience(onSaved: () => void) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: () => Promise<WorkExperienceItem>) => request(),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function refreshSkills(): void {
    void queryClient.invalidateQueries({
      queryKey: SKILLS_PROFILE_QUERY_KEY,
    });

    void queryClient.invalidateQueries({
      queryKey: PROFILE_SKILLS_RADAR_QUERY_KEY,
    });
  }

  async function save(
    payload: WorkExperiencePayload,
    id?: string,
  ): Promise<void> {
    setIsSaving(true);
    setFeedback(null);

    try {
      if (id) {
        await mutation.mutateAsync(() =>
          workExperienceService.updateWorkExperience(id, payload),
        );
      } else {
        await mutation.mutateAsync(() =>
          workExperienceService.createWorkExperience(payload),
        );
      }

      setFeedback({
        type: "success",
        message: id
          ? WORK_EXPERIENCE_FEEDBACK_MESSAGES.updateSuccess
          : WORK_EXPERIENCE_FEEDBACK_MESSAGES.createSuccess,
      });

      onSaved();
      refreshSkills();
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
  }

  return {
    save,
    isSaving,
    feedback,
    clearFeedback,
  };
}
