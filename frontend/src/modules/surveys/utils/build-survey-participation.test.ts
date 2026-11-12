import { describe, expect, it } from "vitest";
import { buildSurveyParticipation } from "./build-survey-participation";

const AUDIENCE = { surveyId: "s1", totalAudience: 120, audienceLabel: "Sistemas", lastReminderAt: null };

describe("buildSurveyParticipation", () => {
  it("calcula la tasa de respuesta y los pendientes", () => {
    expect(buildSurveyParticipation(AUDIENCE, 48)).toMatchObject({ responseRate: 40, responsesReceived: 48, totalAudience: 120, pendingResponses: 72 });
  });

  it("no devuelve pendientes negativos si hay más respuestas que audiencia", () => {
    expect(buildSurveyParticipation(AUDIENCE, 130)).toMatchObject({ responseRate: 100, totalAudience: 130, pendingResponses: 0 });
  });

  it("devuelve 0% cuando la audiencia está vacía", () => {
    expect(buildSurveyParticipation({ ...AUDIENCE, totalAudience: 0 }, 0)).toMatchObject({ responseRate: 0, pendingResponses: 0 });
  });
});
