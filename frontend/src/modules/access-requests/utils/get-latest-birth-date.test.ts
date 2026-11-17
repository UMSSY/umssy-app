import { describe, expect, it } from "vitest";
import { getLatestBirthDate } from "./get-latest-birth-date";

describe("getLatestBirthDate", () => {
  it("devuelve la fecha de hoy hace 18 años, nunca una fecha futura", () => {
    expect(getLatestBirthDate(new Date(2026, 9, 16))).toBe("2008-10-16");
  });

  it("rellena con ceros el mes y el día", () => {
    expect(getLatestBirthDate(new Date(2026, 0, 5))).toBe("2008-01-05");
  });

  it("un 29 de febrero pasa al 1 de marzo en un año no bisiesto", () => {
    expect(getLatestBirthDate(new Date(2028, 1, 29))).toBe("2010-03-01");
  });
});
