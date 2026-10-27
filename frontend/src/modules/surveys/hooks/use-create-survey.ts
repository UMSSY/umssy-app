"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveysService } from "../services/surveys.service";
import type { CreateSurveyPayload } from "../types/survey.types";

export function useCreateSurvey() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: CreateSurveyPayload) => surveysService.createSurvey(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SURVEYS_QUERY_KEYS.all }),
  });

  return {
    createSurvey: mutation.mutateAsync,
    isSaving: mutation.isPending,
    pendingStatus: mutation.isPending ? mutation.variables?.status : undefined,
  };
}
