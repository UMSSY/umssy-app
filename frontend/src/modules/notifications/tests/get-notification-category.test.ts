import { describe, expect, it } from "vitest";
import { getNotificationCategory } from "../utils/get-notification-category";

describe("getNotificationCategory", () => {
  it("devuelve la categoría asignada al tipo", () => {
    expect(getNotificationCategory("SURVEY_PUBLISHED")).toBe("SURVEYS");
    expect(getNotificationCategory("APPOINTMENT_BOOKED")).toBe("REMINDERS");
    expect(getNotificationCategory("EVENT_STARTING_SOON")).toBe("REMINDERS");
    expect(getNotificationCategory("NEW_JOB_APPLICANT")).toBe("SYSTEM");
    expect(getNotificationCategory("CHAT_MESSAGE")).toBe("CHAT");
  });

  it("trata los tipos desconocidos como Sistema", () => {
    expect(getNotificationCategory("NEW_FUTURE_TYPE")).toBe("SYSTEM");
  });
});
