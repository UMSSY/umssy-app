import { describe, expect, it } from "vitest";
import type { NotificationResponse } from "../types/notification-response.types";
import { groupNotificationsByDate } from "../utils/group-notifications-by-date";

function buildNotification(id: string, createdAt: string): NotificationResponse {
  return {
    id,
    title: `Título ${id}`,
    body: "Cuerpo",
    link: "/dashboard",
    readAt: null,
    createdAt,
    typeCode: "SURVEY_PUBLISHED",
  };
}

describe("groupNotificationsByDate", () => {
  it("agrupa notificaciones en HOY, AYER y ANTERIORES", () => {
    const now = new Date("2026-11-15T15:00:00");
    const items = [
      buildNotification("1", "2026-11-15T14:00:00"),
      buildNotification("2", "2026-11-14T18:30:00"),
      buildNotification("3", "2026-11-07T10:00:00"),
    ];

    const groups = groupNotificationsByDate(items, now);

    expect(groups).toHaveLength(3);
    expect(groups[0]?.key).toBe("TODAY");
    expect(groups[0]?.items).toHaveLength(1);
    expect(groups[1]?.key).toBe("YESTERDAY");
    expect(groups[1]?.items).toHaveLength(1);
    expect(groups[2]?.key).toBe("OLDER");
    expect(groups[2]?.items).toHaveLength(1);
  });
});