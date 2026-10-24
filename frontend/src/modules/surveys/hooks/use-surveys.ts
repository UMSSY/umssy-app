"use client";

import { useQuery } from "@tanstack/react-query";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveysService } from "../services/surveys.service";

export function useSurveys() {
  const query = useQuery({
    queryKey: SURVEYS_QUERY_KEYS.list,
    queryFn: surveysService.listSurveys,
  });

  return {
    surveys: query.data?.data ?? [],
    isLoading: query.isPending,
    isRefreshing: query.isFetching && !query.isPending,
    hasError: query.isError,
    refresh: () => void query.refetch(),
  };
}
