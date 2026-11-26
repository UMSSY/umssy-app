import { describe, expect, it } from "vitest";
import { getNotificationInboxFilterFromSlug } from "../utils/get-notification-inbox-filter-from-slug";
import { getNotificationInboxPath } from "../utils/get-notification-inbox-path";

describe("getNotificationInboxPath", () => {
  it.each([
    ["ALL", "/notifications"],
    ["SURVEYS", "/notifications/surveys"],
    ["REMINDERS", "/notifications/reminders"],
    ["SYSTEM", "/notifications/system"],
  ] as const)("devuelve la ruta propia del filtro %s", (filter, path) => {
    expect(getNotificationInboxPath(filter)).toBe(path);
  });
});

describe("getNotificationInboxFilterFromSlug", () => {
  it.each([
    ["surveys", "SURVEYS"],
    ["reminders", "REMINDERS"],
    ["system", "SYSTEM"],
  ] as const)("reconoce el segmento %s", (slug, filter) => {
    expect(getNotificationInboxFilterFromSlug(slug)).toBe(filter);
  });

  it.each(["open", "SURVEYS", "chat", "all", ""])(
    "rechaza el segmento %s",
    (slug) => {
      expect(getNotificationInboxFilterFromSlug(slug)).toBeNull();
    },
  );
});