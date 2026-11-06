"use client";

import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { CERTIFICATION_FEEDBACK_MESSAGES } from "../config/certification-feedback.config";
import { certificationsService } from "../services/certifications.service";
import type { Certification } from "../types/certification.types";
import type { CreateCertificationDto } from "../types/create-certification-dto.types";
import type { UpdateCertificationDto } from "../types/update-certification-dto.types";
import type { CertificationMutationMessages } from "../types/certification-mutation-messages.types";
import type { CertificationMutationOptions } from "../types/certification-mutation-options.types";
import type { Feedback } from "@/modules/profile";
import type { CertificationDocumentChange } from '../types/certification-document-change.types';

function useCertificationMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<Certification>,
  messages: CertificationMutationMessages,
  options: CertificationMutationOptions,
) {
  const mutation = useMutation({ mutationFn: (variables: TVariables) => mutationFn(variables) });
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const lastError = useRef<unknown>(null);

  async function mutate(variables: TVariables): Promise<Certification | null> {
    setIsPending(true);
    setFeedback(null);
    lastError.current = null;
    try {
      const certification = await mutation.mutateAsync(variables);
      setFeedback({ type: "success", message: messages.success });
      options.onSuccess?.(certification);
      return certification;
    } catch (error) {
      lastError.current = error;
      setFeedback({ type: "error", message: messages.error });
      return null;
    } finally {
      setIsPending(false);
    }
  }

  function clearFeedback() {
    setFeedback(null);
    lastError.current = null;
  }

  return { mutate, isPending, feedback, clearFeedback, getError: () => lastError.current };
}

export function useCreateCertification(options: CertificationMutationOptions = {}) {
  return useCertificationMutation(
    (request: CreateCertificationDto | { data: CreateCertificationDto; document: File }) => 'data' in request
      ? certificationsService.createWithDocument(request.data, request.document)
      : certificationsService.createCertification(request),
    {
      success: CERTIFICATION_FEEDBACK_MESSAGES.createSuccess,
      error: CERTIFICATION_FEEDBACK_MESSAGES.createError,
    },
    options,
  );
}

export function useUpdateCertification(options: CertificationMutationOptions = {}) {
  return useCertificationMutation(
    ({ id, data, documentChange }: { id: string; data: UpdateCertificationDto; documentChange?: CertificationDocumentChange }) => documentChange
      ? certificationsService.updateWithDocument(id, data, documentChange)
      : certificationsService.updateCertification(id, data),
    {
      success: CERTIFICATION_FEEDBACK_MESSAGES.updateSuccess,
      error: CERTIFICATION_FEEDBACK_MESSAGES.updateError,
    },
    options,
  );
}
