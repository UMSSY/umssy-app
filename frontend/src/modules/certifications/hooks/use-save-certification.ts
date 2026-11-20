"use client";

import type { CertificationDocumentChange } from "../types/certification-document-change.types";
import type { CertificationSaveResult } from "../types/certification-save-result.types";
import type { CreateCertificationDto } from "../types/create-certification-dto.types";
import type { UseSaveCertificationOptions } from "../types/use-save-certification-options.types";
import { useCreateCertification, useUpdateCertification } from "./use-certification-mutations";
import { isCorruptedFileError } from '../utils/is-corrupted-file-error';
import { CERTIFICATION_DOCUMENT_MESSAGES } from '../config/certification-document.config';

const SAVED: CertificationSaveResult = { status: "saved" };
const FAILED: CertificationSaveResult = { status: "failed", fileError: null };

export function useSaveCertification({ onPersisted }: UseSaveCertificationOptions) {
  const createMutation = useCreateCertification();
  const updateMutation = useUpdateCertification();

  async function save(id: string | null, values: CreateCertificationDto, change: CertificationDocumentChange): Promise<CertificationSaveResult> {
    const result = id
      ? await updateMutation.mutate({ id, data: values, ...(change.type === "keep" ? {} : { documentChange: change }) })
      : await createMutation.mutate(change.type === "replace" ? { data: values, document: change.file } : values);
    if (!result) {
      const mutation = id ? updateMutation : createMutation;
      if (change.type === 'replace' && isCorruptedFileError(mutation.getError())) {
        mutation.clearFeedback();
        return { status: 'failed', fileError: CERTIFICATION_DOCUMENT_MESSAGES.corruptedFile };
      }
      return FAILED;
    }
    onPersisted();
    return SAVED;
  }

  function clearFeedback() {
    createMutation.clearFeedback();
    updateMutation.clearFeedback();
  }

  return { save, clearFeedback, feedback: createMutation.feedback ?? updateMutation.feedback };
}
