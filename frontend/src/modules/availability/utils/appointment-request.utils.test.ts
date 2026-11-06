import { describe, expect, it } from "vitest"
import { formatAppointmentSchedule, validateAppointmentRequest } from "./appointment-request.utils"
import { REQUEST_APPOINTMENT_TEXT } from "../constants/request-appointment.constants"
import type { AvailabilityBlock } from "../types/availability-block.types"
import { FILE_VALIDATION_MESSAGES } from "@/modules/profile"

const block: AvailabilityBlock = {
  id: "1",
  mentorId: "m1",
  startAt: "2026-10-13T13:00:00.000Z",
  endAt: "2026-10-13T14:00:00.000Z",
  state: "free",
  createdAt: "",
  updatedAt: "",
}

describe("validateAppointmentRequest", () => {
  it("acepta un tema elegido y un mensaje escrito", () => {
    expect(validateAppointmentRequest({ orientationTypeId: "t1", message: "Hola", document: null })).toEqual({})
  })

  it.each(["", "   "])("exige el mensaje para el mentor (%j)", (message) => {
    expect(validateAppointmentRequest({ orientationTypeId: "t1", message, document: null })).toEqual({
      message: REQUEST_APPOINTMENT_TEXT.missingMessage,
    })
  })

  it("exige el tema de la sesión", () => {
    expect(validateAppointmentRequest({ orientationTypeId: "", message: "Hola", document: null })).toEqual({
      orientationTypeId: REQUEST_APPOINTMENT_TEXT.missingTopic,
    })
  })

  it("acepta 300 caracteres y rechaza 301", () => {
    expect(validateAppointmentRequest({ orientationTypeId: "t1", message: "a".repeat(300), document: null })).toEqual({})
    expect(validateAppointmentRequest({ orientationTypeId: "t1", message: "a".repeat(301), document: null })).toEqual({
      message: REQUEST_APPOINTMENT_TEXT.messageTooLong,
    })
  })
})

describe("validateAppointmentRequest con documento", () => {
  it("acepta un documento válido y rechaza uno de otro tipo", () => {
    const pdf = new File(["x"], "Tesis.pdf", { type: "application/pdf" })
    const docx = new File(["x"], "notas.docx", { type: "application/msword" })

    expect(validateAppointmentRequest({ orientationTypeId: "t1", message: "Hola", document: pdf })).toEqual({})
    expect(validateAppointmentRequest({ orientationTypeId: "t1", message: "Hola", document: docx })).toEqual({
      document: FILE_VALIDATION_MESSAGES.invalidCertificateType,
    })
  })
})

describe("formatAppointmentSchedule", () => {
  it("muestra fecha y horas en hora de Bolivia", () => {
    expect(formatAppointmentSchedule(block)).toBe(
      "Martes 13 de octubre de 2026, 09:00 - 10:00 · Hora de Bolivia (GMT-4)"
    )
  })
})
