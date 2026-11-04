"use client";

import { useQuery } from "@tanstack/react-query";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveysService } from "../services/surveys.service";

export function useSurveyStatistics(id: string, period?: string) {
  const overview = useQuery({
    queryKey: SURVEYS_QUERY_KEYS.statistics(id),
    queryFn: () => surveysService.getSurveyStatistics(id),
    enabled: Boolean(id),
  });
  const selected = useQuery({
    queryKey: SURVEYS_QUERY_KEYS.statistics(id, period),
    queryFn: () => surveysService.getSurveyStatistics(id, period),
    enabled: Boolean(id) && Boolean(period),
  });
  const active = period ? selected : overview;

  return {
    statistics: active.data?.data,
    availablePeriods: overview.data?.data.availablePeriods ?? [],
    isLoading: active.isPending,
    isRefreshing: active.isFetching && !active.isPending,
    hasError: active.isError,
    refetch: active.refetch,
  };
}
