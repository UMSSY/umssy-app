"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveyParticipationService } from "../services/survey-participation.service";
import { buildSurveyParticipation } from "../utils/build-survey-participation";

export function useSurveyParticipation(id: string, responsesReceived?: number) {
  const queryClient = useQueryClient();
  const audience = useQuery({
    queryKey: SURVEYS_QUERY_KEYS.audience(id),
    queryFn: () => surveyParticipationService.getAudience(id),
    enabled: Boolean(id),
  });
  const reminder = useMutation({
    mutationFn: (pendingResponses: number) => surveyParticipationService.sendReminder(id, pendingResponses),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SURVEYS_QUERY_KEYS.audience(id) }),
  });

  const audienceData = audience.data?.data;
  const participation =
    audienceData && responsesReceived !== undefined ? buildSurveyParticipation(audienceData, responsesReceived) : undefined;

  return {
    participation,
    sendReminder: reminder.mutateAsync,
    isSendingReminder: reminder.isPending,
    refetch: audience.refetch,
  };
}
