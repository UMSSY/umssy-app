import { describe, expect, it } from "vitest";
import { getSafeMapsUrl } from "./get-safe-maps-url";

describe("getSafeMapsUrl", () => {
  it.each([
    "https://maps.app.goo.gl/abc123",
    "https://goo.gl/maps/abc123",
    "https://www.google.com/maps/place/Oficina/@-17.39,-66.15,17z",
  ])("accepts the Google Maps link %s", (url) => {
    expect(getSafeMapsUrl(url)).toBe(url);
  });

  it("trims the spaces around a valid link", () => {
    expect(getSafeMapsUrl("  https://maps.app.goo.gl/abc123  ")).toBe("https://maps.app.goo.gl/abc123");
  });

  it.each([
    "javascript:alert(1)",
    "http://maps.app.goo.gl/abc123",
    "https://example.com/maps",
    "https://jobs.example.invalid/seed/1",
    "",
  ])("rejects %s", (url) => {
    expect(getSafeMapsUrl(url)).toBeNull();
  });

  it("returns null when there is no value", () => {
    expect(getSafeMapsUrl(undefined)).toBeNull();
    expect(getSafeMapsUrl(null)).toBeNull();
  });
});
