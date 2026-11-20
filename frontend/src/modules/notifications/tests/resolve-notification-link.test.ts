import { describe, expect, it } from "vitest";
import { resolveNotificationLink } from "../utils/resolve-notification-link";

describe("resolveNotificationLink", () => {
  it("usa el link del aviso cuando es interno", () => {
    expect(resolveNotificationLink({ typeCode: "CHAT_MESSAGE", link: "/chat?conversationId=abc" })).toBe("/chat?conversationId=abc");
  });

  it("extrae la ruta interna si el link viene como URL absoluta con ruta de la aplicación", () => {
    expect(
      resolveNotificationLink({
        typeCode: "SURVEY_CLOSING_SOON",
        link: "http://localhost:3000/backoffice/surveys/statistics/abc-123",
      }),
    ).toBe("/backoffice/surveys/statistics/abc-123");
  });

  it("usa la vista general del tipo si el link es externo o vacío", () => {
    expect(resolveNotificationLink({ typeCode: "SURVEY_PUBLISHED", link: "" })).toBe("/backoffice/surveys");
    expect(resolveNotificationLink({ typeCode: "APPOINTMENT_BOOKED", link: "https://example.com" })).toBe("/appointments");
  });

  it("usa /dashboard para tipos desconocidos", () => {
    expect(resolveNotificationLink({ typeCode: "NEW_FUTURE_TYPE", link: "" })).toBe("/dashboard");
  });
});
