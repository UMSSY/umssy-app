"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveysService } from "../services/surveys.service";
import type { CreateSurveyPayload } from "../types/survey.types";

export function useUpdateSurvey(id: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: CreateSurveyPayload) => surveysService.updateSurvey(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SURVEYS_QUERY_KEYS.all }),
  });

  return {
    updateSurvey: mutation.mutateAsync,
    isSaving: mutation.isPending,
    pendingStatus: mutation.isPending ? mutation.variables?.status : undefined,
  };
}
