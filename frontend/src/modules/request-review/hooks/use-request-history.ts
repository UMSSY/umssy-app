"use client";

import { useQuery } from "@tanstack/react-query";
import { REQUEST_REVIEW_QUERY_KEYS } from "../constants/request-review-query-keys.constants";
import { automaticValidationService } from "../services/automatic-validation.service";
import { unwrapReviewResult } from "../utils/unwrap-review-result";

export function useRequestHistory(id: string) {
  const query = useQuery({
    queryKey: REQUEST_REVIEW_QUERY_KEYS.history(id),
    queryFn: async () => unwrapReviewResult(await automaticValidationService.getRequestHistory(id)),
  });

  return { timeline: query.data ?? [], isLoading: query.isPending };
}
