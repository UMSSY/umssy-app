import type { SurveyNotification } from "../types/survey-notification.types";

export function countPendingSurveys(notifications: readonly SurveyNotification[]): number {
  return notifications.filter(({ status }) => status === "pending").length;
}
