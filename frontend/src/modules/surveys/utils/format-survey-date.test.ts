import { describe, expect, it } from "vitest";
import { formatSurveyDate } from "./format-survey-date";

describe("formatSurveyDate", () => {
  it("muestra el día, el mes abreviado y el año", () => {
    expect(formatSurveyDate("2026-10-15")).toBe("15 oct. 2026");
    expect(formatSurveyDate("2026-07-25")).toBe("25 jul. 2026");
  });

  it("no corre la fecha un día antes por la zona horaria", () => {
    expect(formatSurveyDate("2026-10-02")).toBe("02 oct. 2026");
  });

  it("devuelve un guion cuando la fecha no es válida", () => {
    expect(formatSurveyDate("no-es-fecha")).toBe("-");
  });
});
