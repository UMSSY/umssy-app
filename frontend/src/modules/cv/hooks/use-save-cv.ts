"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useInvalidateProfileCompleteness } from "@/modules/profile";
import { CV_QUERY_KEY } from "../constants/cv-api.constants";
import { documentsService } from "../services/documents.service";

export function useSaveCv() {
  const queryClient = useQueryClient();
  const invalidateCompleteness = useInvalidateProfileCompleteness();

  return useMutation({
    mutationFn: (file: File) => documentsService.uploadCv(file),
    onMutate: () => queryClient.cancelQueries({ queryKey: CV_QUERY_KEY }),
    onSuccess: async () => {
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: CV_QUERY_KEY }),
        invalidateCompleteness(),
      ]);
    },
  });
}
