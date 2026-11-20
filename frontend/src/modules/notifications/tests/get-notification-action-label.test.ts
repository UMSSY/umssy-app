import { describe, expect, it } from "vitest";
import { getNotificationActionLabel } from "../utils/get-notification-action-label";

describe("getNotificationActionLabel", () => {
  it("devuelve la etiqueta correspondiente para tipos conocidos", () => {
    expect(getNotificationActionLabel("SURVEY_PUBLISHED")).toBe("Responder encuesta");
    expect(getNotificationActionLabel("SURVEY_REMINDER")).toBe("Responder encuesta");
    expect(getNotificationActionLabel("SURVEY_CLOSING_SOON")).toBe("Ver analíticas");
    expect(getNotificationActionLabel("SURVEY_CLOSED")).toBe("Ver resultados");
    expect(getNotificationActionLabel("APPOINTMENT_BOOKED")).toBe("Ver cita");
    expect(getNotificationActionLabel("MENTOR_SLOT_OFFERED")).toBe("Ver oferta");
  });

  it("devuelve la etiqueta por defecto para tipos desconocidos", () => {
    expect(getNotificationActionLabel("UNKNOWN_EVENT")).toBe("Ver detalle");
  });
});