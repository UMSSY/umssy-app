import { describe, expect, it } from "vitest";
import { isNotificationType } from "../utils/is-notification-type";

describe("isNotificationType", () => {
  it("reconoce solo códigos del catálogo", () => {
    expect(isNotificationType("SURVEY_PUBLISHED")).toBe(true);
    expect(isNotificationType("EVENT_STARTING_SOON")).toBe(true);
    expect(isNotificationType("survey_published")).toBe(false);
    expect(isNotificationType("UNKNOWN_TYPE")).toBe(false);
    expect(isNotificationType(null)).toBe(false);
  });
});
