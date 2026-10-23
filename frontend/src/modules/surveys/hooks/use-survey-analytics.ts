"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getHttpStatus } from "@/modules/profile";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveysService } from "../services/surveys.service";

// HU3 (métricas) y HU4 (resultados por pregunta) se piden por separado, como dos endpoints distintos.
export function useSurveyAnalytics(id: string) {
  const metrics = useQuery({
    queryKey: SURVEYS_QUERY_KEYS.metrics(id),
    queryFn: () => surveysService.getSurveyMetrics(id),
  });
  const statistics = useQuery({
    queryKey: SURVEYS_QUERY_KEYS.statistics(id),
    queryFn: () => surveysService.getSurveyStatistics(id),
    retry: false,
  });
  const refetchMetrics = metrics.refetch;
  const refetchStatistics = statistics.refetch;

  const refresh = useCallback(() => {
    void refetchMetrics();
    void refetchStatistics();
  }, [refetchMetrics, refetchStatistics]);

  return {
    metrics: metrics.isError ? undefined : metrics.data?.data,
    statistics: statistics.isError ? undefined : statistics.data?.data,
    isLoading: metrics.isFetching || statistics.isFetching,
    // 409 significa que la encuesta es un borrador y todavía no tiene estadísticas.
    isUnavailable: getHttpStatus(statistics.error) === 409,
    isError: (metrics.isError || statistics.isError) && !metrics.isFetching && !statistics.isFetching,
    refresh,
  };
}
