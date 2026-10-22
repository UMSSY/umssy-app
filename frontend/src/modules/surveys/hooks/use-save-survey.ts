"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SURVEY_SAVE_MESSAGES } from "../constants/survey-form.constants";
import { getSurveyEditPath, SURVEY_TOAST_OPTIONS, SURVEYS_BASE_PATH } from "../constants/surveys.constants";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveysService } from "../services/surveys.service";
import type { SurveyInput } from "../types/survey.types";
import { getSurveySaveErrorMessage } from "../utils/get-survey-save-error-message";
import { clearSurveyFormDraft } from "../utils/survey-form-draft-storage";

export function useSaveSurvey(surveyId: string | null, onSaved: () => void) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Si publicar falla después de crear la encuesta, el siguiente intento la actualiza en vez de crear otra.
  const createdIdRef = useRef<string | null>(null);

  const persist = async (input: SurveyInput) => {
    const id = surveyId ?? createdIdRef.current;
    if (id) return surveysService.updateSurvey(id, input);
    const response = await surveysService.createSurvey(input);
    createdIdRef.current = response.data.id;
    return response;
  };

  const handleError = (error: unknown) => {
    const message = getSurveySaveErrorMessage(error);
    setErrorMessage(message);
    toast.error(message, SURVEY_TOAST_OPTIONS);
  };

  const handleSaved = () => {
    onSaved();
    setErrorMessage(null);
    clearSurveyFormDraft();
    void queryClient.invalidateQueries({ queryKey: SURVEYS_QUERY_KEYS.all });
  };

  const saveDraft = useMutation({
    mutationFn: persist,
    onSuccess: ({ data }) => {
      handleSaved();
      toast.success(SURVEY_SAVE_MESSAGES.draftSaved, SURVEY_TOAST_OPTIONS);
      // Una encuesta nueva pasa a la ruta de edición para que los siguientes guardados la actualicen.
      if (!surveyId) router.replace(getSurveyEditPath(data.id));
    },
    onError: handleError,
  });

  const publish = useMutation({
    mutationFn: async (input: SurveyInput) => {
      const { data } = await persist(input);
      return surveysService.changeSurveyStatus(data.id, "PUBLISHED");
    },
    onSuccess: () => {
      handleSaved();
      toast.success(SURVEY_SAVE_MESSAGES.published, SURVEY_TOAST_OPTIONS);
      router.push(SURVEYS_BASE_PATH);
    },
    onError: handleError,
  });

  return {
    saveDraft: saveDraft.mutate,
    publish: publish.mutate,
    isSaving: saveDraft.isPending || publish.isPending,
    errorMessage,
  };
}
