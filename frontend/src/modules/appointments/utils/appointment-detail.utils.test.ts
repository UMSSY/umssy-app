import { describe, expect, it } from "vitest"
import {
  formatAppointmentDate,
  formatAppointmentRequestedAt,
  getAppointmentDocumentTypeLabel,
} from "./appointment-detail.utils"

describe("formatAppointmentDate", () => {
  it("muestra el día de la semana y la fecha en hora de Bolivia", () => {
    expect(formatAppointmentDate("2026-10-13T13:00:00.000Z")).toBe("Martes 13 de octubre de 2026")
  })

  it("usa el día de Bolivia aunque en UTC ya sea el siguiente", () => {
    expect(formatAppointmentDate("2026-11-01T02:00:00.000Z")).toBe("Sábado 31 de octubre de 2026")
  })
})

describe("formatAppointmentRequestedAt", () => {
  it("muestra la fecha y la hora de la reserva en hora de Bolivia", () => {
    expect(formatAppointmentRequestedAt("2026-10-08T22:42:00.000Z")).toBe("8 de octubre de 2026, 18:42")
  })
})

describe("getAppointmentDocumentTypeLabel", () => {
  it.each([
    ["application/pdf", "PDF"],
    ["image/png", "PNG"],
    ["image/jpeg", "JPG"],
    ["application/octet-stream", "DOC"],
  ])("etiqueta %s como %s", (mimeType, label) => {
    expect(getAppointmentDocumentTypeLabel(mimeType)).toBe(label)
  })
})
