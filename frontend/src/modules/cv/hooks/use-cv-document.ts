'use client';

import { useQuery } from '@tanstack/react-query';
import { CV_QUERY_KEY, CV_RECENT_LIMIT } from '../constants/cv-api.constants';
import { CV_ERROR_MESSAGES } from '../constants/cv-error-messages.constants';
import { useCvMutations } from './use-cv-mutations';
import { documentsService } from '../services/documents.service';
import type { SavedCv } from '../types/saved-cv.types';
import { getCvErrorMessage } from '../utils/get-cv-error-message';

export function useCvDocument() {
  const { uploadMutation, deleteMutation, uploadProgress } = useCvMutations();
  const query = useQuery({
    queryKey: [...CV_QUERY_KEY, 'recent'],
    queryFn: ({ signal }) => {
      signal.throwIfAborted();
      return documentsService.getCvs(1, CV_RECENT_LIMIT);
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
    loadError: query.error
      ? getCvErrorMessage(query.error, CV_ERROR_MESSAGES.load)
      : null,
    reloadCvs: async (): Promise<void> => {
      await query.refetch();
    },
    uploadCv: (file: File): Promise<SavedCv | null> =>
      uploadMutation.mutateAsync(file),
    deleteCv: async (cvId: string): Promise<void> => {
      await deleteMutation.mutateAsync(cvId);
    },
  };
}
