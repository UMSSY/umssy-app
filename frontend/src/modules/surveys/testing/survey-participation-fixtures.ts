import type { SurveyParticipation } from "../types/survey-participation.types";

export function buildParticipation(overrides: Partial<SurveyParticipation> = {}): SurveyParticipation {
  return {
    surveyId: "survey-1",
    respondedCount: 48,
    eligibleCount: 120,
    pendingCount: 72,
    responseRate: 40,
    audienceLabel: "Titulados · Ingeniería de Sistemas · Gestión 2020",
    lastReminderSentAt: "2026-11-05T14:00:00.000Z",
    canSendReminder: true,
    ...overrides,
  };
}
