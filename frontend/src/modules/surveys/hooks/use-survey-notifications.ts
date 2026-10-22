"use client";

import { useQuery } from "@tanstack/react-query";
import {
  SURVEY_NOTIFICATIONS_LOAD_ERROR_MESSAGE,
  SURVEYS_QUERY_KEYS,
} from "../constants/survey-notifications.constants";
import { surveysService } from "../services/surveys.service";
import { countPendingSurveys } from "../utils/count-pending-surveys";

export function useSurveyNotifications() {
  const query = useQuery({
    queryKey: SURVEYS_QUERY_KEYS.notifications,
    queryFn: surveysService.getNotifications,
  });
  const notifications = query.data ?? [];

  return {
    notifications,
    pendingCount: countPendingSurveys(notifications),
    isLoading: query.isPending,
    errorMessage: query.isError ? SURVEY_NOTIFICATIONS_LOAD_ERROR_MESSAGE : undefined,
  };
}
