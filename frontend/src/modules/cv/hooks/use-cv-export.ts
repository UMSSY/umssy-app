"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { documentsService } from "../services/documents.service";
import type { GeneratedCv } from "../types/generated-cv.types";
import { getCvExportErrorMessage } from "../utils/get-cv-export-error-message";

export function useCvExport() {
  const mutation = useMutation({ mutationFn: () => documentsService.generateCv() });
  const [generatedCv, setGeneratedCv] = useState<GeneratedCv | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    [],
  );

  const releasePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setGeneratedCv(null);
  };

  const generateCv = async (): Promise<GeneratedCv | null> => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    releasePreview();
    setError(null);

    try {
      const { file, fileName } = await mutation.mutateAsync();

      if (requestIdRef.current !== requestId) {
        return null;
      }

      const previewUrl = URL.createObjectURL(file);
      const cv: GeneratedCv = { file, previewUrl, fileName };
      previewUrlRef.current = previewUrl;
      setGeneratedCv(cv);
      return cv;
    } catch (generationError) {
      if (requestIdRef.current === requestId) {
        setError(getCvExportErrorMessage(generationError));
      }
      return null;
    }
  };

  return {
    generatedCv,
    isGenerating: mutation.isPending,
    error,
    generateCv,
  };
}
