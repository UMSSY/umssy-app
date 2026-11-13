"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CV_FILE_QUERY_KEY, CV_QUERY_KEY, CV_RECENT_LIMIT } from "../constants/cv-api.constants";
import { CV_ERROR_MESSAGES } from "../constants/cv-error-messages.constants";
import { CV_UPLOAD_PROGRESS } from "../constants/cv-upload.constants";
import { documentsService } from "../services/documents.service";
import type { SavedCv } from "../types/saved-cv.types";
import { getCvErrorMessage } from "../utils/get-cv-error-message";
import { useInvalidateProfileCompleteness } from "@/modules/profile";

export function useCvDocument() {
  const queryClient = useQueryClient();
  const invalidateCompleteness = useInvalidateProfileCompleteness();
  const [uploadProgress, setUploadProgress] = useState<number>(CV_UPLOAD_PROGRESS.min);
  const query = useQuery({
    queryKey: [...CV_QUERY_KEY, "recent"],
    queryFn: ({ signal }) => {
      signal.throwIfAborted();
      return documentsService.getCvs(1, CV_RECENT_LIMIT);
    },
  });
  const cancelLoads = () => queryClient.cancelQueries({ queryKey: CV_QUERY_KEY });
  const reloadCvs = () => queryClient.invalidateQueries({ queryKey: CV_QUERY_KEY });
  const refreshAfterSave = () => Promise.all([reloadCvs(), invalidateCompleteness()]);
  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentsService.uploadCv(file, setUploadProgress),
    onMutate: () => {
      setUploadProgress(CV_UPLOAD_PROGRESS.min);
      return cancelLoads();
    },
    onSuccess: refreshAfterSave,
    onSettled: () => setUploadProgress(CV_UPLOAD_PROGRESS.min),
  });
  const deleteMutation = useMutation({
    mutationFn: (cvId: string) => documentsService.deleteCv(cvId),
    onMutate: cancelLoads,
    onSuccess: (_result, cvId) => {
      queryClient.removeQueries({ queryKey: [...CV_FILE_QUERY_KEY, cvId] });
      return refreshAfterSave();
    },
  });
  const recentCvs = query.data?.items ?? [];

  return {
    recentCvs,
    currentCv: recentCvs.find((cv) => cv.isCurrent) ?? null,
    totalCvs: query.data?.totalItems ?? 0,
    isLoading: query.isPending,
    isReloading: query.isFetching,
    isUploading: uploadMutation.isPending,
    uploadProgress,
    isDeleting: deleteMutation.isPending,
    loadError: query.error ? getCvErrorMessage(query.error, CV_ERROR_MESSAGES.load) : null,
    reloadCvs: async (): Promise<void> => {
      await query.refetch();
    },
    uploadCv: (file: File): Promise<SavedCv | null> => uploadMutation.mutateAsync(file),
    deleteCv: async (cvId: string): Promise<void> => {
      await deleteMutation.mutateAsync(cvId);
    },
  };
}
