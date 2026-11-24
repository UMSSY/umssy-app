import { describe, expect, it } from "vitest";
import { formatNotificationTime } from "../utils/format-notification-time";

describe("formatNotificationTime", () => {
  const now = new Date("2026-11-15T15:00:00");

  it("formatea tiempos recientes del mismo día", () => {
    expect(formatNotificationTime("2026-11-15T14:59:45", now)).toBe("Ahora");
    expect(formatNotificationTime("2026-11-15T14:45:00", now)).toBe("Hace 15 min");
    expect(formatNotificationTime("2026-11-15T13:00:00", now)).toBe("Hace 2 h");
  });

  it("formatea fechas de ayer con hora", () => {
    expect(formatNotificationTime("2026-11-14T09:05:00", now)).toBe("Ayer, 09:05");
  });

  it("formatea fechas anteriores con día y mes corto", () => {
    expect(formatNotificationTime("2026-11-07T18:30:00", now)).toBe("7 nov");
  });

  it("devuelve cadena vacía ante fechas inválidas", () => {
    expect(formatNotificationTime("fecha-invalida", now)).toBe("");
  });
});