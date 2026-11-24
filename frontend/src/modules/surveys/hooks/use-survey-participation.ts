"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SURVEYS_QUERY_KEYS } from "../constants/surveys-query-keys.constants";
import { surveyParticipationService } from "../services/survey-participation.service";

export function useSurveyParticipation(id: string) {
  const queryClient = useQueryClient();
  const participation = useQuery({
    queryKey: SURVEYS_QUERY_KEYS.participation(id),
    queryFn: () => surveyParticipationService.getParticipation(id),
    enabled: Boolean(id),
  });
  const reminder = useMutation({
    mutationFn: () => surveyParticipationService.sendReminders(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SURVEYS_QUERY_KEYS.participation(id) }),
  });

  return {
    participation: participation.data?.data,
    hasParticipationError: participation.isError,
    sendReminders: reminder.mutateAsync,
    isSendingReminder: reminder.isPending,
    refetch: participation.refetch,
  };
}
