import { describe, expect, it } from "vitest";
import { toExpiresAtIso } from "./to-expires-at-iso";

describe("toExpiresAtIso", () => {
  it("cierra a las 23:59 de Bolivia, que en UTC ya es el día siguiente", () => {
    expect(toExpiresAtIso(new Date(2026, 11, 15))).toBe("2026-12-16T03:59:00.000Z");
  });

  it("cambia de año correctamente el 31 de diciembre", () => {
    expect(toExpiresAtIso(new Date(2026, 11, 31))).toBe("2027-01-01T03:59:00.000Z");
  });
});