import { describe, expect, it } from "vitest";
import { formatExpirationDate } from "./format-expiration-date";

describe("formatExpirationDate", () => {
  it("formatea la fecha completa en español", () => {
    expect(formatExpirationDate(new Date(2026, 11, 15))).toBe("martes 15 de diciembre de 2026");
  });
});