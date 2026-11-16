'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  PROFILE_SKILLS_RADAR_QUERY_KEY,
  useInvalidateProfileCompleteness,
  type Feedback,
} from '@/modules/profile';
import { MY_SKILLS_QUERY_KEY } from '@/modules/skills';
import { WORK_EXPERIENCE_FEEDBACK_MESSAGES } from '../config/work-experience-feedback.config';
import { workExperienceService } from '../services/work-experience.service';
import type { WorkExperienceItem } from '../types/work-experience-item.types';
import type { WorkExperiencePayload } from '../types/work-experience-payload.types';

export function useSaveWorkExperience(
  onSaved: () => void,
  { forGuide = false }: { forGuide?: boolean } = {},
) {
  const queryClient = useQueryClient();
  const invalidateCompleteness = useInvalidateProfileCompleteness();

  const mutation = useMutation({
    mutationFn: (request: () => Promise<WorkExperienceItem>) => request(),
    onSuccess: forGuide ? undefined : invalidateCompleteness,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function refreshSkills(): Promise<void> {
    setIsAnalyzing(true);

    try {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: MY_SKILLS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: PROFILE_SKILLS_RADAR_QUERY_KEY,
        }),
      ]);
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
        type: 'success',
        message: id
          ? WORK_EXPERIENCE_FEEDBACK_MESSAGES.updateSuccess
          : WORK_EXPERIENCE_FEEDBACK_MESSAGES.createSuccess,
      });

      onSaved();

      if (forGuide) void invalidateCompleteness().catch(() => {});
      void refreshSkills().catch(() => {});
    } catch {
      setFeedback({
        type: 'error',
        message: id
          ? WORK_EXPERIENCE_FEEDBACK_MESSAGES.updateError
          : WORK_EXPERIENCE_FEEDBACK_MESSAGES.createError,
      });
    } finally {
      setIsSaving(false);
    }
  }

  function clearFeedback(): void {
    setFeedback(null);
  }

  return {
    save,
    isSaving,
    isAnalyzing,
    feedback,
    clearFeedback,
  };
}
