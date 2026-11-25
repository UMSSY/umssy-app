import { describe, expect, it } from "vitest";
import { formatOpenTime } from "./format-open-time";

const NOW = new Date("2026-11-18T15:00:00.000Z");

describe("formatOpenTime", () => {
  it("indica Hoy si se publicó el mismo día", () => {
    expect(formatOpenTime("2026-11-18T13:00:00.000Z", NOW)).toBe("Hoy");
  });

  it("usa singular para un día", () => {
    expect(formatOpenTime("2026-11-17T13:00:00.000Z", NOW)).toBe("Hace 1 día");
  });

  it("muestra los días cuando lleva menos de un mes", () => {
    expect(formatOpenTime("2026-11-08T13:00:00.000Z", NOW)).toBe("Hace 10 días");
  });

  it("muestra los meses cuando lleva 30 días o más", () => {
    expect(formatOpenTime("2026-10-19T13:00:00.000Z", NOW)).toBe("Hace 1 mes");
    expect(formatOpenTime("2026-07-18T13:00:00.000Z", NOW)).toBe("Hace 4 meses");
  });

  it("muestra los años cuando lleva un año o más", () => {
    expect(formatOpenTime("2025-11-18T13:00:00.000Z", NOW)).toBe("Hace 1 año");
  });

  it("cuenta los días con la fecha de Bolivia y no la de UTC", () => {
    // 01:30 UTC del 18/11 todavía es 17/11 en Bolivia.
    expect(formatOpenTime("2026-11-17T20:00:00.000Z", new Date("2026-11-18T01:30:00.000Z"))).toBe("Hoy");
  });

  it("no devuelve valores negativos si la fecha es futura", () => {
    expect(formatOpenTime("2026-12-01T13:00:00.000Z", NOW)).toBe("Hoy");
  });
});
