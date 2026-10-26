import { describe, expect, it } from "vitest";
import { AuditRequestError, unwrapAuditResult } from "./audit-request-error";
import { formatBoliviaDateTime } from "./format-bolivia-date-time";
import { getCurrentMonthPeriod } from "./get-current-month-period";
import { getPageNumbers } from "./get-page-numbers";

describe("getCurrentMonthPeriod", () => {
  it("devuelve del primer al último día del mes en curso", () => {
    expect(getCurrentMonthPeriod(new Date("2026-10-24T12:00:00-04:00"))).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(getCurrentMonthPeriod(new Date("2028-02-10T12:00:00-04:00"))).toEqual({ from: "2028-02-01", to: "2028-02-29" });
  });

  it("usa el mes de Bolivia aunque en UTC ya sea el mes siguiente", () => {
    expect(getCurrentMonthPeriod(new Date("2026-11-01T02:00:00.000Z"))).toEqual({ from: "2026-10-01", to: "2026-10-31" });
  });
});

describe("formatBoliviaDateTime", () => {
  it("convierte a hora de Bolivia sin depender de la zona del dispositivo", () => {
    expect(formatBoliviaDateTime("2026-09-22T15:41:00.000Z")).toEqual({ date: "22/09/2026", time: "11:41" });
    // Las 02:00 UTC todavía son el día anterior en Bolivia
    expect(formatBoliviaDateTime("2026-09-23T02:00:00.000Z")).toEqual({ date: "22/09/2026", time: "22:00" });
  });

  it("una fecha inválida devuelve null en lugar de romper el renderizado", () => {
    expect(formatBoliviaDateTime("no-es-fecha")).toBeNull();
  });
});

describe("unwrapAuditResult", () => {
  it("devuelve los datos o lanza un error que conserva el código HTTP", () => {
    expect(unwrapAuditResult({ ok: true, data: 5 })).toBe(5);
    try {
      unwrapAuditResult({ ok: false, status: 401, message: "Tu sesión expiró." });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AuditRequestError);
      expect((error as AuditRequestError).status).toBe(401);
      expect((error as Error).message).toBe("Tu sesión expiró.");
    }
  });
});

describe("getPageNumbers", () => {
  it("muestra todas las páginas cuando caben", () => {
    expect(getPageNumbers(1, 3)).toEqual([1, 2, 3]);
  });

  it("usa puntos suspensivos al inicio, en medio y al final según la página actual", () => {
    expect(getPageNumbers(1, 13)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 13]);
    expect(getPageNumbers(7, 13)).toEqual([1, "ellipsis-start", 6, 7, 8, "ellipsis-end", 13]);
    expect(getPageNumbers(13, 13)).toEqual([1, "ellipsis-start", 9, 10, 11, 12, 13]);
  });
});
