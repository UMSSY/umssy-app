"use client";

import { useQuery } from "@tanstack/react-query";
import {
  SURVEY_NOTIFICATIONS_LOAD_ERROR_MESSAGE,
  SURVEY_NOTIFICATIONS_QUERY_KEYS,
} from "../constants/survey-notifications.constants";
import { surveyNotificationsService } from "../services/survey-notifications.service";
import { countPendingSurveys } from "../utils/count-pending-surveys";

export function useSurveyNotifications() {
  const query = useQuery({
    queryKey: SURVEY_NOTIFICATIONS_QUERY_KEYS.notifications,
    queryFn: surveyNotificationsService.getNotifications,
  });
  const notifications = query.data ?? [];

  return {
    notifications,
    pendingCount: countPendingSurveys(notifications),
    isLoading: query.isPending,
    errorMessage: query.isError ? SURVEY_NOTIFICATIONS_LOAD_ERROR_MESSAGE : undefined,
  };
}
