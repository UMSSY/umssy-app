"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  COMPANY_CORRECTION_AUTHORIZATION_MESSAGE,
  COMPANY_CORRECTION_MISSING_FILE_MESSAGE,
  COMPANY_CORRECTION_RETRY_MESSAGE,
} from "../constants/company-request-status.constants";
import { companyAccessRequestService } from "../services/company-access-request.service";
import type { CompanyDocumentCorrectionFormProps } from "../types/company-document-correction-form-props.types";
import type { DocumentCorrectionSelection } from "../types/document-correction-selection.types";
import type { DocumentState } from "../types/document-state.types";
import { isCompanyCorrectionToken } from "../utils/company-correction-token";
import { validateDocumentFile } from "../utils/validate-document-file";

export function useCompanyDocumentCorrection({
  requestCode,
  token,
  onSubmitted,
  onCancel,
  onAuthorizationLost,
}: CompanyDocumentCorrectionFormProps) {
  const [selection, setSelection] = useState<DocumentCorrectionSelection | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectionRef = useRef<DocumentCorrectionSelection | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  const revokeSelection = useCallback(() => {
    if (selectionRef.current) URL.revokeObjectURL(selectionRef.current.previewUrl);
    selectionRef.current = null;
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      revokeSelection();
    };
  }, [revokeSelection]);

  function selectFile(file: File) {
    if (inFlight.current) return;
    const invalid = validateDocumentFile(file);
    setFileError(invalid);
    if (invalid) return;

    let previewUrl: string;
    try {
      previewUrl = URL.createObjectURL(file);
    } catch {
      setFileError("No se pudo preparar la vista previa. Vuelve a elegir el archivo.");
      return;
    }
    revokeSelection();
    const next = { file, previewUrl };
    selectionRef.current = next;
    setSelection(next);
    setSubmitError(null);
    setProgress(0);
  }

  function removeFile() {
    if (inFlight.current) return;
    revokeSelection();
    setSelection(null);
    setFileError(null);
    setSubmitError(null);
    setProgress(0);
  }

  function cancel() {
    if (inFlight.current) return;
    removeFile();
    onCancel();
  }

  async function submit() {
    if (inFlight.current) return;
    const selected = selectionRef.current;
    const invalid = selected
      ? validateDocumentFile(selected.file)
      : COMPANY_CORRECTION_MISSING_FILE_MESSAGE;
    setFileError(invalid);
    setSubmitError(null);
    if (invalid || !selected) return;
    if (!isCompanyCorrectionToken(token)) {
      setSubmitError(COMPANY_CORRECTION_AUTHORIZATION_MESSAGE);
      return;
    }

    inFlight.current = true;
    setIsSubmitting(true);
    setProgress(0);
    try {
      const result = await companyAccessRequestService.resubmitDocument(
        requestCode,
        token,
        selected.file,
        (percent) => {
          if (mounted.current && inFlight.current) setProgress(percent);
        },
      );
      if (!mounted.current) return;
      if (!result.ok) {
        if (result.status === 401) {
          onAuthorizationLost();
          return;
        }
        setSubmitError(result.message);
        return;
      }
      revokeSelection();
      setSelection(null);
      onSubmitted(result.data);
    } catch {
      if (mounted.current) setSubmitError(COMPANY_CORRECTION_RETRY_MESSAGE);
    } finally {
      inFlight.current = false;
      if (mounted.current) setIsSubmitting(false);
    }
  }

  const document: DocumentState | null = selection
    ? {
        documentType: null,
        fileName: selection.file.name,
        fileSize: selection.file.size,
        mimeType: selection.file.type,
        previewUrl: selection.previewUrl,
        progress,
        error: fileError,
      }
    : null;

  return {
    document,
    fileError,
    submitError,
    isSubmitting,
    progress,
    selectFile,
    removeFile,
    cancel,
    submit,
  };
}
