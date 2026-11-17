// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatApplicationDate } from "./format-application-date";

describe("formatApplicationDate", () => {
  it("formats the date as day, short month and year", () => {
    expect(formatApplicationDate("2026-11-10T14:00:00.000Z")).toBe("10 nov 2026");
  });

  it("returns the original text when the date is invalid", () => {
    expect(formatApplicationDate("sin fecha")).toBe("sin fecha");
  });
});
