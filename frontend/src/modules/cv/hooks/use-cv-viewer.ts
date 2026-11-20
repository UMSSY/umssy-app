"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { CV_FILE_QUERY_KEY } from "../constants/cv-api.constants";
import { CV_ERROR_MESSAGES } from "../constants/cv-error-messages.constants";
import { documentsService } from "../services/documents.service";
import type { CvPreview } from "../types/cv-preview.types";
import type { SavedCv } from "../types/saved-cv.types";
import { getCvErrorMessage } from "../utils/get-cv-error-message";

export function useCvViewer() {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<CvPreview | null>(null);
  const [openingCvId, setOpeningCvId] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    [],
  );

  const closeCv = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreview(null);
  };

  const openCv = async (cv: SavedCv): Promise<string | null> => {
    setOpeningCvId(cv.id);

    try {
      const file = await queryClient.fetchQuery({
        queryKey: [...CV_FILE_QUERY_KEY, cv.id],
        queryFn: () => documentsService.getCvFile(cv.id),
        staleTime: Infinity,
      });
      closeCv();
      const previewUrl = URL.createObjectURL(file);
      previewUrlRef.current = previewUrl;
      setPreview({ cv, file, previewUrl });
      return null;
    } catch (error) {
      return getCvErrorMessage(error, CV_ERROR_MESSAGES.open);
    } finally {
      setOpeningCvId(null);
    }
  };

  return { preview, openingCvId, openCv, closeCv };
}
