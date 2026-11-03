"use client";

import { useQuery } from "@tanstack/react-query";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveysService } from "../services/surveys.service";

// period (I-2026 / II-2026) limita los resultados a las respuestas de ese semestre; sin él, se ven todas.
// La consulta sin semestre se conserva en caché y de ella salen los semestres del selector, así que el selector
// no desaparece mientras carga el semestre elegido. Cada semestre es una consulta aparte: al cambiar, los valores
// anteriores no se reutilizan y la vista muestra el estado de carga.
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
