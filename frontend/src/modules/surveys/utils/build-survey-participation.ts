import type { SurveyAudience } from "../types/survey-audience.types";
import type { SurveyParticipation } from "../types/survey-participation.types";

export function buildSurveyParticipation(audience: SurveyAudience, responsesReceived: number): SurveyParticipation {
  const totalAudience = Math.max(audience.totalAudience, responsesReceived, 0);
  const received = Math.max(responsesReceived, 0);
  const responseRate = totalAudience === 0 ? 0 : Math.round((received / totalAudience) * 100);

  return {
    responseRate,
    responsesReceived: received,
    totalAudience,
    pendingResponses: totalAudience - received,
    audienceLabel: audience.audienceLabel,
    lastReminderAt: audience.lastReminderAt,
  };
}
