import { describe, expect, it } from "vitest";
import {
  formatDaysLeft,
  formatExpirationDate,
  formatShortExpirationDate,
} from "./format-expiration-date";

const DATE = new Date(2026, 11, 15);

describe("formatExpirationDate", () => {
  it("formatea la fecha completa en español", () => {
    expect(formatExpirationDate(DATE)).toBe("martes 15 de diciembre de 2026");
  });
});

describe("formatShortExpirationDate", () => {
  it("formatea la fecha como DD/MM/AAAA", () => {
    expect(formatShortExpirationDate(DATE)).toBe("15/12/2026");
  });
});

describe("formatDaysLeft", () => {
  it("usa singular cuando falta un día", () => {
    expect(formatDaysLeft(DATE, new Date(2026, 11, 14))).toBe("Falta 1 día");
  });

  it("usa plural cuando faltan varios días", () => {
    expect(formatDaysLeft(DATE, new Date(2026, 10, 15))).toBe("Faltan 30 días");
  });
});