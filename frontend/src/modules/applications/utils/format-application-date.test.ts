import { describe, expect, it } from "vitest";
import { formatApplicationDate } from "./format-application-date";

describe("formatApplicationDate", () => {
  it("shows day, month and year", () => {
    expect(formatApplicationDate("2026-11-10T15:30:00.000Z")).toBe("10/11/2026");
  });

  it("uses the Bolivia time zone, so an evening application keeps its local day", () => {
    expect(formatApplicationDate("2026-11-10T02:00:00.000Z")).toBe("09/11/2026");
  });
});
