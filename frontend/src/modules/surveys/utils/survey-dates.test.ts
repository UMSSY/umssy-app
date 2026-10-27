import { describe, expect, it } from "vitest";
import {
  formatDisplayDate,
  formatIsoDisplayDate,
  getBoliviaTodayValue,
  toCalendarDate,
  toClosesAtIso,
  toDateValue,
  toOpensAtIso,
} from "./survey-dates";

describe("survey-dates", () => {
  it("calcula hoy en la zona horaria de Bolivia", () => {
    expect(getBoliviaTodayValue(new Date("2026-10-23T02:00:00.000Z"))).toBe("2026-10-22");
    expect(getBoliviaTodayValue()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("convierte entre valores de fecha y objetos Date", () => {
    expect(toCalendarDate("")).toBeUndefined();
    expect(toCalendarDate("no-es-fecha")).toBeUndefined();
    expect(toDateValue(toCalendarDate("2026-11-03") as Date)).toBe("2026-11-03");
  });

  it("formatea con dd/MM/yyyy", () => {
    expect(formatDisplayDate("2026-11-03")).toBe("03/11/2026");
    expect(formatDisplayDate("")).toBe("");
    expect(formatIsoDisplayDate("2026-12-16T03:59:59.999Z")).toBe("15/12/2026");
    expect(formatIsoDisplayDate(null)).toBe("");
  });

  it("envía la apertura al inicio del día y el cierre al final del día de Bolivia", () => {
    expect(toOpensAtIso("2026-11-03")).toBe("2026-11-03T04:00:00.000Z");
    expect(toClosesAtIso("2026-12-15")).toBe("2026-12-16T03:59:59.999Z");
  });
});
