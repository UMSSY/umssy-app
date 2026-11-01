"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { REQUEST_REVIEW_QUERY_KEYS } from "../constants/request-review-query-keys.constants";
import { automaticValidationService } from "../services/automatic-validation.service";
import { useInvalidateReviewQueries } from "./use-invalidate-review-queries";

export function useRevertApproval(requestId: string) {
  const queryClient = useQueryClient();
  const invalidateReviewQueries = useInvalidateReviewQueries();

  return useMutation({
    mutationFn: async () => {
      const result = await automaticValidationService.revertApproval(requestId);
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      void Promise.all([
        invalidateReviewQueries(requestId),
        queryClient.invalidateQueries({ queryKey: REQUEST_REVIEW_QUERY_KEYS.history(requestId) }),
      ]);
    },
  });
}
