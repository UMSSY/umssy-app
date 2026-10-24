"use client";

import { useQuery } from "@tanstack/react-query";
import { SURVEY_RESPONSE_QUERY_KEYS, SURVEY_RESPONSE_TEXT } from "../constants/survey-response.constants";
import { surveyResponseService } from "../services/survey-response.service";

export function useSurveyToAnswer(surveyId: string) {
  const query = useQuery({
    queryKey: SURVEY_RESPONSE_QUERY_KEYS.survey(surveyId),
    queryFn: () => surveyResponseService.getSurveyToAnswer(surveyId),
  });

  return {
    survey: query.data ?? null,
    isLoading: query.isPending,
    errorMessage: query.isError ? SURVEY_RESPONSE_TEXT.loadError : undefined,
  };
}
