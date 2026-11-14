import { describe, expect, it } from "vitest";
import { isInternalNotificationLink } from "../utils/is-internal-notification-link";

describe("isInternalNotificationLink", () => {
  it("acepta rutas relativas de la aplicación", () => {
    expect(isInternalNotificationLink("/chat?conversationId=abc")).toBe(true);
  });

  it("rechaza enlaces externos, vacíos o nulos", () => {
    expect(isInternalNotificationLink("https://example.com")).toBe(false);
    expect(isInternalNotificationLink("//example.com")).toBe(false);
    expect(isInternalNotificationLink("/\\example.com")).toBe(false);
    expect(isInternalNotificationLink("")).toBe(false);
    expect(isInternalNotificationLink(null)).toBe(false);
  });
});
