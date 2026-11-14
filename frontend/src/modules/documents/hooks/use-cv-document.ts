"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CV_FILE_QUERY_KEY, CV_QUERY_KEY, CV_RECENT_LIMIT } from "../constants/cv-api.constants";
import { CV_ERROR_MESSAGES } from "../constants/cv-error-messages.constants";
import { documentsService } from "../services/documents.service";
import { getCvErrorMessage } from "../utils/get-cv-error-message";

export function useCvDocument() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [...CV_QUERY_KEY, "recent"],
    queryFn: ({ signal }) => {
      signal.throwIfAborted();
      return documentsService.getCvs(1, CV_RECENT_LIMIT);
    },
  });
  const cancelLoads = () => queryClient.cancelQueries({ queryKey: CV_QUERY_KEY });
  const reloadCvs = () => queryClient.invalidateQueries({ queryKey: CV_QUERY_KEY });
  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentsService.uploadCv(file),
    onMutate: cancelLoads,
    onSuccess: reloadCvs,
  });
  const deleteMutation = useMutation({
    mutationFn: (cvId: string) => documentsService.deleteCv(cvId),
    onMutate: cancelLoads,
    onSuccess: (_result, cvId) => {
      queryClient.removeQueries({ queryKey: [...CV_FILE_QUERY_KEY, cvId] });
      return reloadCvs();
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
    isDeleting: deleteMutation.isPending,
    loadError: query.error ? getCvErrorMessage(query.error, CV_ERROR_MESSAGES.load) : null,
    reloadCvs: async (): Promise<void> => {
      await query.refetch();
    },
    uploadCv: async (file: File): Promise<void> => {
      await uploadMutation.mutateAsync(file);
    },
    deleteCv: async (cvId: string): Promise<void> => {
      await deleteMutation.mutateAsync(cvId);
    },
  };
}
