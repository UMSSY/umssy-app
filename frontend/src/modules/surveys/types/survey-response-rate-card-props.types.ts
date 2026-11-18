import type { SurveyParticipation } from "./survey-participation.types";

export interface SurveyResponseRateCardProps {
  participation: SurveyParticipation;
  isSendingReminder: boolean;
  onSendReminder: () => void;
}
