import { describe, expect, it } from "vitest";
import { getSurveyYears, matchesSurveyYear, toSurveyAcademicPeriod } from "./survey-academic-periods";

describe("survey-academic-periods", () => {
  it("lista los años desde el actual en Bolivia hasta el primero", () => {
    expect(getSurveyYears(new Date("2026-10-24T12:00:00.000Z"), 2024)).toEqual(["2026", "2025", "2024"]);
    expect(getSurveyYears(new Date("2027-01-01T02:00:00.000Z"), 2026)).toEqual(["2026"]);
    expect(getSurveyYears()[0]).toMatch(/^\d{4}$/);
  });

  it("convierte gestiones antiguas al año y conserva Todas", () => {
    expect(toSurveyAcademicPeriod("II-2026")).toBe("2026");
    expect(toSurveyAcademicPeriod("2025")).toBe("2025");
    expect(toSurveyAcademicPeriod("Todas")).toBe("Todas");
    expect(toSurveyAcademicPeriod(null)).toBe("");
    expect(toSurveyAcademicPeriod("sin año")).toBe("");
  });

  it("filtra por año incluyendo las encuestas de todas las gestiones", () => {
    expect(matchesSurveyYear("2026", "2026")).toBe(true);
    expect(matchesSurveyYear("I-2026", "2026")).toBe(true);
    expect(matchesSurveyYear("Todas", "2026")).toBe(true);
    expect(matchesSurveyYear("2025", "2026")).toBe(false);
    expect(matchesSurveyYear(null, "2026")).toBe(false);
  });
});
