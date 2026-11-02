import { describe, expect, it } from "vitest";
import { formatBoliviaDate } from "./format-bolivia-date";

describe("formatBoliviaDate", () => {
  it("formatea la fecha como DD/MM/AAAA", () => {
    expect(formatBoliviaDate("2026-10-12T14:00:00.000Z")).toBe("12/10/2026");
  });

  it("usa la hora de Bolivia y no la de UTC", () => {
    // 21:30 del 27/10 en Bolivia ya es 28/10 en UTC.
    expect(formatBoliviaDate("2026-10-28T01:30:00.000Z")).toBe("27/10/2026");
  });
});
