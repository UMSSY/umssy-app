"use client";

import { useQuery } from "@tanstack/react-query";
import { MINUTE_MS } from "@/shared/constants/date-time.constants";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveysService } from "../services/surveys.service";

export function useCareers() {
  const query = useQuery({
    queryKey: SURVEYS_QUERY_KEYS.careers,
    queryFn: surveysService.listCareers,
    staleTime: 5 * MINUTE_MS,
  });

  return {
    careers: query.data?.data ?? [],
    isLoading: query.isPending,
    hasError: query.isError,
  };
}
