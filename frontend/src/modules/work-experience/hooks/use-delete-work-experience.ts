"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PROFILE_SKILLS_RADAR_QUERY_KEY } from "@/modules/profile";
import { SKILLS_PROFILE_QUERY_KEY } from "@/modules/skills";
import type { Feedback } from "@/modules/profile";
import { WORK_EXPERIENCE_FEEDBACK_MESSAGES } from "../config/work-experience-feedback.config";
import { workExperienceService } from "../services/work-experience.service";
import type { WorkExperienceItem } from "../types/work-experience-item.types";

export function useDeleteWorkExperience(
  onDeleted: (experience: WorkExperienceItem) => void,
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (experience: WorkExperienceItem) =>
      workExperienceService.deleteWorkExperience(experience.id),
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function deleteWorkExperience(
    experience: WorkExperienceItem,
  ): Promise<void> {
    setIsDeleting(true);
    setFeedback(null);

    try {
      await mutation.mutateAsync(experience);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: SKILLS_PROFILE_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: PROFILE_SKILLS_RADAR_QUERY_KEY,
        }),
      ]);

      setFeedback({
        type: "success",
        message: WORK_EXPERIENCE_FEEDBACK_MESSAGES.deleteSuccess,
      });

      onDeleted(experience);
    } catch {
      setFeedback({
        type: "error",
        message: WORK_EXPERIENCE_FEEDBACK_MESSAGES.deleteError,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function clearFeedback(): void {
    setFeedback(null);
  }

  return {
    deleteWorkExperience,
    isDeleting,
    feedback,
    clearFeedback,
  };
}