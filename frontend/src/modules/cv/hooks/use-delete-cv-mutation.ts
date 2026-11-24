'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useInvalidateProfileCompleteness } from '@/modules/profile';
import { CV_FILE_QUERY_KEY, CV_QUERY_KEY } from '../constants/cv-api.constants';
import { documentsService } from '../services/documents.service';

export function useDeleteCvMutation() {
  const queryClient = useQueryClient();
  const invalidateCompleteness = useInvalidateProfileCompleteness();

  return useMutation({
    mutationFn: (cvId: string) => documentsService.deleteCv(cvId),
    onMutate: () => queryClient.cancelQueries({ queryKey: CV_QUERY_KEY }),
    onSuccess: async (_result, cvId) => {
      queryClient.removeQueries({ queryKey: [...CV_FILE_QUERY_KEY, cvId] });
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: CV_QUERY_KEY }),
        invalidateCompleteness(),
      ]);
    },
  });
}
