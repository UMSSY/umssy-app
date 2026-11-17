import { describe, expect, it } from "vitest";
import type { Registration } from "@/modules/event-registrations";
import { toFinishedRegistrationItem } from "./to-finished-registration-item";

describe("toFinishedRegistrationItem", () => {
  it("keeps only display fields and drops pass credentials", () => {
    const payload = {
      id: "registration-1",
      eventName: "Taller de historia",
      date: "2026-09-20T00:00:00.000Z",
      startTime: "1970-01-01T09:00:00.000Z",
      endTime: "1970-01-01T12:00:00.000Z",
      location: null,
      status: "Confirmada",
      qrToken: "secret",
      passCode: "private",
    };
    const item = toFinishedRegistrationItem(payload as unknown as Registration);

    expect(item).toEqual({
      id: "registration-1",
      title: "Taller de historia",
      date: "2026-09-20T00:00:00.000Z",
      startTime: "1970-01-01T09:00:00.000Z",
      endTime: "1970-01-01T12:00:00.000Z",
      location: null,
    });
    expect(JSON.stringify(item)).not.toContain("secret");
    expect(JSON.stringify(item)).not.toContain("private");
  });
});
