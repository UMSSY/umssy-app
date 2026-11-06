"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PROFILE_SKILLS_RADAR_QUERY_KEY } from "@/modules/profile/hooks/use-profile-skills-radar";
import { useState } from "react";
import { CERTIFICATION_FEEDBACK_MESSAGES } from "../config/certification-feedback.config";
import { certificationsService } from "../services/certifications.service";
import type { Certification } from "../types/certification.types";
import type { Feedback } from "@/modules/profile";

export function useDeleteCertification(onSuccess?: (certification: Certification) => void) {
  const queryClient = useQueryClient();
  const mutation = useMutation({ mutationFn: (id: string) => certificationsService.deleteCertification(id) });
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function deleteCertification(certification: Certification): Promise<boolean> {
    setIsDeleting(true);
    setFeedback(null);
    try {
      await mutation.mutateAsync(certification.id);
      await queryClient.invalidateQueries({ queryKey: PROFILE_SKILLS_RADAR_QUERY_KEY });
      setFeedback({ type: "success", message: CERTIFICATION_FEEDBACK_MESSAGES.deleteSuccess });
      onSuccess?.(certification);
      return true;
    } catch {
      setFeedback({ type: "error", message: CERTIFICATION_FEEDBACK_MESSAGES.deleteError });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }

  function clearFeedback() {
    setFeedback(null);
  }

  return { deleteCertification, isDeleting, feedback, clearFeedback };
}
