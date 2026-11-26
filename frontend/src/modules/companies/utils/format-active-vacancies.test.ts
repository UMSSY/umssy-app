import { describe, expect, it } from "vitest";
import { formatActiveVacancies } from "./format-active-vacancies";

describe("formatActiveVacancies", () => {
  it("uses singular for one vacancy and plural for the rest", () => {
    expect(formatActiveVacancies(1)).toBe("1 vacante disponible");
    expect(formatActiveVacancies(5)).toBe("5 vacantes disponibles");
  });
});
