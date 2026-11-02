"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CV_HISTORY_PAGE_SIZE, CV_QUERY_KEY } from "../constants/cv-api.constants";
import { CV_ERROR_MESSAGES } from "../constants/cv-error-messages.constants";
import { documentsService } from "../services/documents.service";
import { getCvErrorMessage } from "../utils/get-cv-error-message";

export function useCvHistory(page: number) {
  const query = useQuery({
    queryKey: [...CV_QUERY_KEY, "history", page],
    queryFn: () => documentsService.getCvs(page, CV_HISTORY_PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

  return {
    cvs: query.data?.items ?? [],
    totalCvs: query.data?.totalItems ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isLoading: query.isPending,
    loadError: query.error ? getCvErrorMessage(query.error, CV_ERROR_MESSAGES.history) : null,
  };
}
