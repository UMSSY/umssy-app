"use client";

import { useQuery } from "@tanstack/react-query";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveysService } from "../services/surveys.service";

export function useSurveyStatistics(id: string) {
  const query = useQuery({
    queryKey: SURVEYS_QUERY_KEYS.statistics(id),
    queryFn: () => surveysService.getSurveyStatistics(id),
    enabled: Boolean(id),
  });

  return {
    statistics: query.data?.data,
    isLoading: query.isPending,
    hasError: query.isError,
    refetch: query.refetch,
  };
}
