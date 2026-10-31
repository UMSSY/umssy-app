"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveysService } from "../services/surveys.service";

export function useUnpublishSurvey() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => surveysService.unpublishSurvey(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SURVEYS_QUERY_KEYS.all }),
  });

  return {
    unpublishSurvey: mutation.mutateAsync,
    isUnpublishing: mutation.isPending,
  };
}
