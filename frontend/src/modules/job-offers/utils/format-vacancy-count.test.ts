import { describe, expect, it } from "vitest";
import { formatVacancyCount } from "./format-vacancy-count";

describe("formatVacancyCount", () => {
  it("usa el singular para una sola vacante", () => {
    expect(formatVacancyCount(1)).toBe("1 vacante");
    expect(formatVacancyCount("1")).toBe("1 vacante");
  });

  it("usa el plural para varias vacantes", () => {
    expect(formatVacancyCount(2)).toBe("2 vacantes");
  });
});
