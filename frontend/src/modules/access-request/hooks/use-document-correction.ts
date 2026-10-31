"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DOCUMENT_TYPES, type DocumentType } from "../constants/document-types.constants";
import {
  CORRECTION_AUTHORIZATION_MESSAGE,
  CORRECTION_MISSING_FILE_MESSAGE,
  CORRECTION_MISSING_TYPE_MESSAGE,
  CORRECTION_RETRY_MESSAGE,
} from "../constants/document-correction.constants";
import { accessRequestService } from "../services/access-request.service";
import type { DocumentState } from "../types/access-request-context.types";
import type { DocumentCorrectionFormProps, DocumentCorrectionSelection } from "../types/document-correction.types";
import { isDocumentCorrectionToken } from "../utils/document-correction-link";
import { validateDocumentFile } from "../utils/validate-document-file";

export function useDocumentCorrection({ requestCode, token, initialDocumentType, onSubmitted, onCancel }: DocumentCorrectionFormProps) {
  const initialType = initialDocumentType && DOCUMENT_TYPES.includes(initialDocumentType) ? initialDocumentType : null;
  const [documentType, setDocumentType] = useState<DocumentType | null>(initialType);
  const [selection, setSelection] = useState<DocumentCorrectionSelection | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectionRef = useRef<DocumentCorrectionSelection | null>(null);
  const typeRef = useRef<DocumentType | null>(initialType);
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

  function selectType(value: DocumentType) {
    if (inFlight.current) return;
    typeRef.current = value;
    setDocumentType(value);
    setTypeError(null);
    setSubmitError(null);
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
    const type = typeRef.current;
    const invalid = selected ? validateDocumentFile(selected.file) : CORRECTION_MISSING_FILE_MESSAGE;
    setFileError(invalid);
    setTypeError(type ? null : CORRECTION_MISSING_TYPE_MESSAGE);
    setSubmitError(null);
    if (invalid || !selected || !type) return;
    if (!isDocumentCorrectionToken(token)) {
      setSubmitError(CORRECTION_AUTHORIZATION_MESSAGE);
      return;
    }

    // Se bloquea antes del primer await para impedir dos confirmaciones en el mismo render.
    inFlight.current = true;
    setIsSubmitting(true);
    setProgress(0);
    try {
      const result = await accessRequestService.resubmitDocument(requestCode, token, selected.file, type, (percent) => {
        if (mounted.current && inFlight.current) setProgress(percent);
      });
      if (!mounted.current) return;
      if (!result.ok) {
        setSubmitError(result.message);
        return;
      }
      revokeSelection();
      setSelection(null);
      onSubmitted(result.data);
    } catch {
      if (mounted.current) setSubmitError(CORRECTION_RETRY_MESSAGE);
    } finally {
      inFlight.current = false;
      if (mounted.current) setIsSubmitting(false);
    }
  }

  const document: DocumentState | null = selection ? {
    documentType,
    fileName: selection.file.name,
    fileSize: selection.file.size,
    mimeType: selection.file.type,
    previewUrl: selection.previewUrl,
    progress,
    error: fileError,
  } : null;

  return { documentType, document, fileError, typeError, submitError, isSubmitting, progress, selectFile, selectType, removeFile, cancel, submit };
}
