import { SAMPLE_SURVEY_NOTIFICATIONS } from "../constants/sample-survey-notifications.constants";
import type { SurveyNotification } from "../types/survey-notification.types";

// Datos de ejemplo hasta que exista el endpoint del backend.
export const surveysService = {
  getNotifications: async (): Promise<SurveyNotification[]> => SAMPLE_SURVEY_NOTIFICATIONS,
};
