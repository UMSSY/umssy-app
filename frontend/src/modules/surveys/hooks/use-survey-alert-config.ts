"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveyParticipationService } from "../services/survey-participation.service";
import type { SurveyAlertConfigPayload } from "../types/survey-alert-config.types";

export function useSurveyAlertConfig(id: string) {
  const queryClient = useQueryClient();
  const config = useQuery({
    queryKey: SURVEYS_QUERY_KEYS.alertConfig(id),
    queryFn: () => surveyParticipationService.getAlertConfig(id),
    enabled: Boolean(id),
  });
  const save = useMutation({
    mutationFn: (payload: SurveyAlertConfigPayload) => surveyParticipationService.saveAlertConfig(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SURVEYS_QUERY_KEYS.alertConfig(id) }),
  });

  return {
    config: config.data?.data,
    isLoading: config.isPending,
    saveConfig: save.mutateAsync,
    isSaving: save.isPending,
  };
}
