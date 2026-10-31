"use client";

import { useQuery } from "@tanstack/react-query";
import { REQUEST_REVIEW_QUERY_KEYS } from "../constants/request-review-query-keys.constants";
import { automaticValidationService } from "../services/automatic-validation.service";
import { unwrapReviewResult } from "../utils/unwrap-review-result";
import { useInboxSummary } from "./use-inbox-summary";

export function useAutomationSummary() {
  const inbox = useInboxSummary();
  const query = useQuery({
    queryKey: REQUEST_REVIEW_QUERY_KEYS.automationSummary,
    queryFn: async () => unwrapReviewResult(await automaticValidationService.getAutomationSummary()),
  });

  return {
    automation: query.data ?? null,
    inbox: inbox.summary,
    isLoading: query.isPending || inbox.isLoading,
    error: query.error?.message ?? inbox.error,
    retry: () => {
      void query.refetch();
      inbox.retry();
    },
  };
}
