"use client";

import { useQuery } from "@tanstack/react-query";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { surveysService } from "../services/surveys.service";

export function useSurveyDetail(id: string) {
  const query = useQuery({
    queryKey: SURVEYS_QUERY_KEYS.detail(id),
    queryFn: () => surveysService.getSurvey(id),
    enabled: Boolean(id),
  });

  return {
    survey: query.data?.data,
    isLoading: query.isPending,
    hasError: query.isError,
    errorMessage: query.isError
      ? (getApiErrorDetail(query.error) ?? (query.error instanceof Error ? query.error.message : undefined))
      : undefined,
  };
}
