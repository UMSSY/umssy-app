import { describe, expect, it } from "vitest";
import { formatCountdown } from "./format-countdown";

describe("formatCountdown", () => {
  it("formats 180 seconds as 03:00", () => {
    expect(formatCountdown(180)).toBe("03:00");
  });

  it("formats 120 seconds as 02:00", () => {
    expect(formatCountdown(120)).toBe("02:00");
  });

  it("formats 65 seconds as 01:05", () => {
    expect(formatCountdown(65)).toBe("01:05");
  });

  it("formats 9 seconds as 00:09", () => {
    expect(formatCountdown(9)).toBe("00:09");
  });

  it("formats 0 seconds as 00:00", () => {
    expect(formatCountdown(0)).toBe("00:00");
  });

  it("handles negative values safely as 00:00", () => {
    expect(formatCountdown(-5)).toBe("00:00");
  });
});
