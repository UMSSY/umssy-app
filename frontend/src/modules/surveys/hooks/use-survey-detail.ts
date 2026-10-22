"use client";

import { useQuery } from "@tanstack/react-query";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveysService } from "../services/surveys.service";

export function useSurveyDetail(id: string) {
  const query = useQuery({
    queryKey: SURVEYS_QUERY_KEYS.detail(id),
    queryFn: () => surveysService.getSurvey(id),
    // Al editar se necesita la versión guardada más reciente, no la de caché.
    staleTime: 0,
    gcTime: 0,
  });

  return { survey: query.data?.data, isLoading: query.isPending, isError: query.isError };
}
