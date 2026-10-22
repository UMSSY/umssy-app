"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import {
  SURVEY_STATUS_CHANGE_ERROR_MESSAGE,
  SURVEY_STATUS_CHANGE_SUCCESS_MESSAGES,
  SURVEY_TOAST_OPTIONS,
} from "../constants/surveys.constants";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveysService } from "../services/surveys.service";
import type { SurveyStatusChange } from "../types/survey-status-change.types";

export function useChangeSurveyStatus() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, status }: SurveyStatusChange) => surveysService.changeSurveyStatus(id, status),
    onSuccess: (_response, { status }) => {
      toast.success(SURVEY_STATUS_CHANGE_SUCCESS_MESSAGES[status], SURVEY_TOAST_OPTIONS);
    },
    onError: (error) => {
      toast.error(getApiErrorDetail(error) ?? SURVEY_STATUS_CHANGE_ERROR_MESSAGE, SURVEY_TOAST_OPTIONS);
    },
    // Al terminar, la lista se vuelve a pedir para mostrar el estado guardado.
    onSettled: () => queryClient.invalidateQueries({ queryKey: SURVEYS_QUERY_KEYS.all }),
  });

  return {
    changeStatus: mutation.mutate,
    // Mientras se guarda, la fila muestra el estado nuevo para que el cambio se vea inmediato.
    pendingChange: mutation.isPending ? mutation.variables : undefined,
  };
}
