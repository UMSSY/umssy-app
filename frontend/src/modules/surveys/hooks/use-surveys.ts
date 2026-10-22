"use client";

import { useCallback } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { AcademicPeriod } from "@/modules/reports";
import { SURVEYS_LOAD_ERROR_MESSAGE, SURVEYS_PAGE_SIZE } from "../constants/surveys.constants";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveysService } from "../services/surveys.service";

export function useSurveys(page: number, period?: AcademicPeriod, search = "") {
  const query = useQuery({
    queryKey: SURVEYS_QUERY_KEYS.list(page, period, search),
    queryFn: () => surveysService.getSurveys({ page, limit: SURVEYS_PAGE_SIZE, period, search }),
    placeholderData: keepPreviousData,
  });
  const { refetch } = query;

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const result = query.isError ? undefined : query.data?.data;
  const totalItems = result?.totalItems ?? 0;

  return {
    surveys: result?.items ?? [],
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / SURVEYS_PAGE_SIZE)),
    isLoading: query.isFetching,
    errorMessage: query.isError && !query.isFetching ? SURVEYS_LOAD_ERROR_MESSAGE : undefined,
    refresh,
  };
}
