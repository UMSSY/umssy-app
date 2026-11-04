"use client";

import { useCallback, useEffect, useState } from "react";
import type { AcademicPeriod } from "@/modules/reports";
import { SURVEY_HISTORY_LOAD_ERROR_MESSAGE, SURVEY_HISTORY_PAGE_SIZE } from "../constants/survey-history.constants";
import { surveyHistoryService } from "../services/survey-history.service";
import type { SurveyHistoryState } from "../types/survey-history.types";

export function useSurveyHistory(page: number, academicPeriod: AcademicPeriod, search = "") {
  const [state, setState] = useState<SurveyHistoryState | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const requestKey = `${page}-${academicPeriod}-${search}-${refreshCount}`;

  useEffect(() => {
    let isCancelled = false;

    surveyHistoryService
      .getSurveyHistory({ page, limit: SURVEY_HISTORY_PAGE_SIZE, academicPeriod, search })
      .then((response) => {
        if (!isCancelled) setState({ requestKey, result: response.data });
      })
      .catch(() => {
        if (!isCancelled) setState({ requestKey, errorMessage: SURVEY_HISTORY_LOAD_ERROR_MESSAGE });
      });

    return () => {
      isCancelled = true;
    };
  }, [page, academicPeriod, search, requestKey]);

  const refresh = useCallback(() => setRefreshCount((count) => count + 1), []);

  const isCurrentRequest = state?.requestKey === requestKey;
  const totalItems = state?.result?.totalItems ?? 0;

  return {
    surveys: isCurrentRequest ? (state.result?.items ?? []) : [],
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / SURVEY_HISTORY_PAGE_SIZE)),
    isLoading: !isCurrentRequest,
    errorMessage: isCurrentRequest ? state.errorMessage : undefined,
    refresh,
  };
}
