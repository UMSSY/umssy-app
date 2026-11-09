"use client";
import { useMutation } from "@tanstack/react-query";
import { surveysService } from "../services/surveys.service";
import type { SubmitSurveyPayload } from "../types/submit-survey-payload.types";

export function useSubmitSurveyAnswers(id: string) {
  return useMutation({
    mutationFn: (payload: SubmitSurveyPayload) =>
      surveysService.submitAnswers(id, payload),
  });
}
