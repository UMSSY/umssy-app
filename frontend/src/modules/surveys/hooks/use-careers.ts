"use client";

import { useQuery } from "@tanstack/react-query";
import { CAREERS_STALE_TIME_MS, SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveysService } from "../services/surveys.service";

export function useCareers() {
  const query = useQuery({
    queryKey: SURVEYS_QUERY_KEYS.careers,
    queryFn: surveysService.listCareers,
    staleTime: CAREERS_STALE_TIME_MS,
  });

  return {
    careers: query.data?.data ?? [],
    isLoading: query.isPending,
    hasError: query.isError,
  };
}
